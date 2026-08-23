package com.kasirnusantara.app;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(InstallerPlugin.class);
        registerPlugin(app.capgo.backgroundtask.BackgroundTaskPlugin.class);
        registerPlugin(app.capgo.nfc.CapacitorNfcPlugin.class);
        super.onCreate(savedInstanceState);
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
        }
    }
}
