package com.kasirnusantara.app;

import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.webkit.WebView;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "PembukaApk")
public class InstallerPlugin extends Plugin {

    @PluginMethod
    public void install(PluginCall call) {
        String file = call.getString("file", "KasirNusantara-pembaruan.apk");
        try {
            File apk = new File(getContext().getCacheDir(), file);
            if (!apk.exists()) {
                call.reject("Berkas tidak ditemukan");
                return;
            }
            Uri uri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                apk
            );
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.setClipData(ClipData.newRawUri("apk", uri));
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.toString());
        }
    }

    @PluginMethod
    public void bagikan(PluginCall call) {
        String file = call.getString("file", "cadangan-kasir.json");
        String jenis = call.getString("jenis", "application/json");
        try {
            File berkas = new File(getContext().getCacheDir(), file);
            if (!berkas.exists()) {
                call.reject("Berkas tidak ditemukan");
                return;
            }
            Uri uri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                berkas
            );
            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType(jenis);
            intent.putExtra(Intent.EXTRA_STREAM, uri);
            intent.setClipData(ClipData.newRawUri("cadangan", uri));
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            Intent chooser = Intent.createChooser(intent, "Bagikan cadangan");
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.toString());
        }
    }

    @PluginMethod
    public void unduh(PluginCall call) {
        final String urlStr = call.getString("url");
        final String file = call.getString("file", "KasirNusantara-pembaruan.apk");
        if (urlStr == null || urlStr.isEmpty()) {
            call.reject("URL kosong");
            return;
        }
        Executors.newSingleThreadExecutor().execute(new Runnable() {
            @Override
            public void run() {
                HttpURLConnection conn = null;
                try {
                    URL url = new URL(urlStr);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setInstanceFollowRedirects(true);
                    conn.setRequestProperty("User-Agent", "KasirNusantara");
                    conn.setConnectTimeout(10000);
                    conn.setReadTimeout(20000);
                    long total = conn.getContentLengthLong();
                    InputStream in = new BufferedInputStream(conn.getInputStream(), 65536);
                    File out = new File(getContext().getCacheDir(), file);
                    OutputStream os = new FileOutputStream(out);
                    byte[] buf = new byte[65536];
                    long terunduh = 0;
                    int n;
                    while ((n = in.read(buf)) != -1) {
                        os.write(buf, 0, n);
                        terunduh += n;
                        JSObject p = new JSObject();
                        p.put("terunduh", terunduh);
                        p.put("total", total);
                        notifyListeners("progres", p);
                    }
                    os.flush();
                    os.close();
                    in.close();
                    if (terunduh == 0) {
                        call.reject("Berkas kosong");
                        return;
                    }
                    call.resolve();
                } catch (Exception e) {
                    call.reject(e.toString());
                } finally {
                    if (conn != null) conn.disconnect();
                }
            }
        });
    }

    @PluginMethod
    public void bersihkan(PluginCall call) {
        try {
            int terhapus = 0;
            long batasJson = System.currentTimeMillis() - 24L * 60 * 60 * 1000;
            File[] daftar = getContext().getCacheDir().listFiles();
            if (daftar != null) {
                for (File f : daftar) {
                    String nama = f.getName().toLowerCase();
                    boolean apkLama = nama.endsWith(".apk");
                    boolean cadanganBasi =
                        nama.startsWith("cadangan-kasir") && f.lastModified() < batasJson;
                    if ((apkLama || cadanganBasi) && f.delete()) terhapus++;
                }
            }
            JSObject hasil = new JSObject();
            hasil.put("terhapus", terhapus);
            call.resolve(hasil);
        } catch (Exception e) {
            call.reject(e.toString());
        }
    }

    @Override
    public void load() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
        }
    }
}
