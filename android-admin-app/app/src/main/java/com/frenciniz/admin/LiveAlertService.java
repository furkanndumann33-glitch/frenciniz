package com.frenciniz.admin;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class LiveAlertService extends Service {
    public static final String EXTRA_SESSION_COOKIE = "session_cookie";
    private static final String PREFS = "frenciniz_admin_notifications";
    private static final String COOKIE_KEY = "session_cookie";
    private static final String LAST_AT_KEY = "last_alert_at";
    private static final String SERVICE_CHANNEL = "frenciniz_live_service";
    private static final String ALERT_CHANNEL = "frenciniz_live_alerts";
    private static final int SERVICE_NOTIFICATION_ID = 7001;
    private static final String ALERT_URL = "https://www.frenciniz.com/api/admin/live-alerts";

    private ScheduledExecutorService executor;
    private SharedPreferences prefs;

    @Override
    public void onCreate() {
        super.onCreate();
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        createChannels();
        startForeground(SERVICE_NOTIFICATION_ID, serviceNotification());
        executor = Executors.newSingleThreadScheduledExecutor();
        executor.scheduleWithFixedDelay(new Runnable() {
            @Override public void run() {
                pollAlerts();
            }
        }, 1, 15, TimeUnit.SECONDS);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String cookie = intent.getStringExtra(EXTRA_SESSION_COOKIE);
            if (cookie != null && cookie.startsWith("frenciniz_session=")) {
                String previous = prefs.getString(COOKIE_KEY, "");
                SharedPreferences.Editor editor = prefs.edit().putString(COOKIE_KEY, cookie);
                if (!cookie.equals(previous)) editor.remove(LAST_AT_KEY);
                editor.apply();
            }
        }
        return START_STICKY;
    }

    private void createChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        NotificationChannel service = new NotificationChannel(
            SERVICE_CHANNEL,
            "Canlı destek bağlantısı",
            NotificationManager.IMPORTANCE_LOW
        );
        service.setDescription("Frenciniz canlı destek bildirim bağlantısını açık tutar.");
        manager.createNotificationChannel(service);

        NotificationChannel alerts = new NotificationChannel(
            ALERT_CHANNEL,
            "Yeni ziyaretçi ve mesajlar",
            NotificationManager.IMPORTANCE_HIGH
        );
        alerts.setDescription("Yeni ilgili ziyaretçi ve canlı destek mesajlarını bildirir.");
        alerts.enableVibration(true);
        alerts.enableLights(true);
        alerts.setLightColor(Color.rgb(255, 96, 0));
        manager.createNotificationChannel(alerts);
    }

    private PendingIntent openChatIntent(String sessionId, int requestCode) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra(MainActivity.EXTRA_OPEN_CHAT, true);
        intent.putExtra(MainActivity.EXTRA_CHAT_SESSION, sessionId == null ? "" : sessionId);
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(this, requestCode, intent, flags);
    }

    private Notification serviceNotification() {
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, SERVICE_CHANNEL)
            : new Notification.Builder(this);
        return builder
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Frenciniz canlı destek aktif")
            .setContentText("Yeni ziyaretçi ve mesajlar takip ediliyor.")
            .setContentIntent(openChatIntent("", SERVICE_NOTIFICATION_ID))
            .setOngoing(true)
            .setCategory(Notification.CATEGORY_SERVICE)
            .build();
    }

    private void pollAlerts() {
        String cookie = prefs.getString(COOKIE_KEY, "");
        if (!cookie.startsWith("frenciniz_session=")) return;
        HttpURLConnection connection = null;
        try {
            String lastAt = prefs.getString(LAST_AT_KEY, "");
            String endpoint = ALERT_URL;
            if (!lastAt.isEmpty()) endpoint += "?since=" + URLEncoder.encode(lastAt, "UTF-8");
            connection = (HttpURLConnection) new URL(endpoint).openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(8000);
            connection.setReadTimeout(8000);
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("Cookie", cookie);
            connection.setRequestProperty("User-Agent", "FrencinizAdmin/1.1 Android");
            int status = connection.getResponseCode();
            if (status == 401 || status == 403) {
                prefs.edit().remove(COOKIE_KEY).remove(LAST_AT_KEY).apply();
                stopSelf();
                return;
            }
            if (status != 200) return;
            String body = readAll(connection.getInputStream());
            JSONObject payload = new JSONObject(body);
            JSONArray events = payload.optJSONArray("events");
            if (events != null) {
                for (int i = 0; i < events.length(); i++) notifyEvent(events.optJSONObject(i));
            }
            String serverNow = payload.optString("serverNow", "");
            if (!serverNow.isEmpty()) prefs.edit().putString(LAST_AT_KEY, serverNow).apply();
        } catch (Exception ignored) {
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private String readAll(InputStream stream) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) out.append(line);
        reader.close();
        return out.toString();
    }

    private void notifyEvent(JSONObject event) {
        if (event == null) return;
        String id = event.optString("id", String.valueOf(System.currentTimeMillis()));
        String type = event.optString("type", "presence");
        String sessionId = event.optString("sessionId", "");
        String product = event.optString("productName", "");
        String title = event.optString("pageTitle", "");
        String path = event.optString("path", "/");
        String message = event.optString("message", "");
        boolean isMessage = "message".equals(type);

        String notificationTitle = isMessage ? "Yeni canlı destek mesajı" : "Yeni ilgili ziyaretçi";
        String detail = isMessage ? message : (!product.isEmpty() ? product : (!title.isEmpty() ? title : path));
        if (detail.length() > 140) detail = detail.substring(0, 140);
        int notificationId = 7100 + Math.abs(id.hashCode() % 50000);

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, ALERT_CHANNEL)
            : new Notification.Builder(this);
        Notification notification = builder
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(notificationTitle)
            .setContentText(detail)
            .setStyle(new Notification.BigTextStyle().bigText(detail))
            .setContentIntent(openChatIntent(sessionId, notificationId))
            .setAutoCancel(true)
            .setCategory(Notification.CATEGORY_MESSAGE)
            .setPriority(Notification.PRIORITY_HIGH)
            .setDefaults(Notification.DEFAULT_ALL)
            .build();
        getSystemService(NotificationManager.class).notify(notificationId, notification);
    }

    @Override
    public void onDestroy() {
        if (executor != null) executor.shutdownNow();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
