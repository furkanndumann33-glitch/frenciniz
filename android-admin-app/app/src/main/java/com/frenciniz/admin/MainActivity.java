package com.frenciniz.admin;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.SslErrorHandler;
import android.net.http.SslError;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String ADMIN_URL = "https://www.frenciniz.com/admin-login";
    private static final String CHAT_URL = "https://www.frenciniz.com/admin?adminTab=chat-history";
    private static final String ALLOWED_HOST = "www.frenciniz.com";
    private static final int FILE_CHOOSER_REQUEST = 501;
    private static final int NOTIFICATION_PERMISSION_REQUEST = 502;
    public static final String EXTRA_OPEN_CHAT = "open_chat";
    public static final String EXTRA_CHAT_SESSION = "chat_session";

    private WebView webView;
    private ProgressBar progress;
    private ValueCallback<Uri[]> fileCallback;
    private String lastServiceCookie = null;
    private final Handler sessionHandler = new Handler(Looper.getMainLooper());
    private final Runnable sessionMonitor = new Runnable() {
        @Override public void run() {
            syncNotificationService();
            sessionHandler.postDelayed(this, 2500);
        }
    };

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.adminWebView);
        progress = findViewById(R.id.loadingProgress);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, false);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setUserAgentString(settings.getUserAgentString() + " FrencinizAdmin/1.0");

        webView.setWebViewClient(new AdminWebViewClient());
        webView.setWebChromeClient(new AdminWebChromeClient());
        webView.setDownloadListener(downloadListener);

        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION_REQUEST);
        }

        if (savedInstanceState == null) {
            webView.loadUrl(getIntent().getBooleanExtra(EXTRA_OPEN_CHAT, false) ? CHAT_URL : ADMIN_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
        sessionHandler.post(sessionMonitor);
    }

    private String adminSessionCookie() {
        String all = CookieManager.getInstance().getCookie("https://www.frenciniz.com");
        if (all == null) return "";
        for (String part : all.split(";")) {
            String cookie = part.trim();
            if (cookie.startsWith("frenciniz_session=")) return cookie;
        }
        return "";
    }

    private void syncNotificationService() {
        String cookie = adminSessionCookie();
        if (cookie.equals(lastServiceCookie)) return;
        lastServiceCookie = cookie;
        Intent service = new Intent(this, LiveAlertService.class);
        if (cookie.isEmpty()) {
            stopService(service);
            return;
        }
        service.putExtra(LiveAlertService.EXTRA_SESSION_COOKIE, cookie);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(service);
        else startService(service);
    }

    private boolean isAllowedAdminUrl(Uri uri) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())) return false;
        String host = uri.getHost();
        if (!(ALLOWED_HOST.equalsIgnoreCase(host) || "frenciniz.com".equalsIgnoreCase(host))) return false;
        String path = uri.getPath() == null ? "/" : uri.getPath();
        return path.equals("/admin") || path.equals("/admin-login") || path.equals("/admin-panel")
            || path.startsWith("/api/admin/") || path.startsWith("/api/auth/");
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, "Bağlantı açılamadı.", Toast.LENGTH_SHORT).show();
        }
    }

    private final DownloadListener downloadListener = new DownloadListener() {
        @Override
        public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
            Uri uri = Uri.parse(url);
            if ("https".equalsIgnoreCase(uri.getScheme()) &&
                (ALLOWED_HOST.equalsIgnoreCase(uri.getHost()) || "frenciniz.com".equalsIgnoreCase(uri.getHost()))) {
                openExternal(uri);
            } else {
                Toast.makeText(MainActivity.this, "Güvenli olmayan indirme engellendi.", Toast.LENGTH_SHORT).show();
            }
        }
    };

    private class AdminWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (isAllowedAdminUrl(uri)) return false;
            if ("https".equalsIgnoreCase(uri.getScheme()) || "mailto".equalsIgnoreCase(uri.getScheme()) || "tel".equalsIgnoreCase(uri.getScheme())) {
                openExternal(uri);
            }
            return true;
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            progress.setVisibility(View.VISIBLE);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            progress.setVisibility(View.GONE);
            injectAdminGuard(view);
            syncNotificationService();
        }

        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            handler.cancel();
            Toast.makeText(MainActivity.this, "Güvenli bağlantı doğrulanamadı.", Toast.LENGTH_LONG).show();
        }
    }

    private void injectAdminGuard(WebView view) {
        String script = "(function(){" +
            "if(window.__frencinizAdminGuard)return;window.__frencinizAdminGuard=true;" +
            "var allowed=function(){return /^\\/admin(?:-login|-panel)?\\/?$/.test(location.pathname);};" +
            "setInterval(function(){if(!allowed())location.replace('/admin');},500);" +
            "document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');" +
            "if(a&&a.origin===location.origin&&!/^\\/admin(?:-login|-panel)?\\/?$/.test(a.pathname)){e.preventDefault();location.replace('/admin');}},true);" +
            "})();";
        view.evaluateJavascript(script, null);
    }

    private class AdminWebChromeClient extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            progress.setProgress(newProgress);
            progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
        }

        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = callback;
            try {
                startActivityForResult(params.createIntent(), FILE_CHOOSER_REQUEST);
                return true;
            } catch (ActivityNotFoundException error) {
                fileCallback = null;
                Toast.makeText(MainActivity.this, "Dosya seçici bulunamadı.", Toast.LENGTH_SHORT).show();
                return false;
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || fileCallback == null) return;
        fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
        fileCallback = null;
    }

    @Override
    public void onBackPressed() {
        Uri current = Uri.parse(webView.getUrl() == null ? ADMIN_URL : webView.getUrl());
        if (!current.getPath().equals("/admin") && webView.canGoBack()) {
            webView.goBack();
        } else {
            moveTaskToBack(true);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent.getBooleanExtra(EXTRA_OPEN_CHAT, false) && webView != null) webView.loadUrl(CHAT_URL);
    }

    @Override
    protected void onDestroy() {
        sessionHandler.removeCallbacks(sessionMonitor);
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }
}
