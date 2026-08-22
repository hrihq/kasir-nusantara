package com.kasirnusantara.app;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // WAJIB sebelum super.onCreate(): daftar plugin terkunci saat Bridge dibuat
        registerPlugin(InstallerPlugin.class);
        super.onCreate(savedInstanceState);
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
        }
    }
}
