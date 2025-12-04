/*
 * BasePhone WebView Activity
 * Custom WebView with JavaScript bridge for native functionality
 */
package app.vercel.baselauncher.twa;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.util.Log;

public class WebViewActivity extends Activity {
    private static final String TAG = "WebViewActivity";
    private WebView webView;
    private BasePhoneBridge bridge;
    private static final String URL = "https://baselauncher.vercel.app";
    
    // Domains that should open in external browser for auth
    private static final String[] EXTERNAL_AUTH_DOMAINS = {
        "keys.coinbase.com",
        "wallet.coinbase.com", 
        "coinbase.com",
        "accounts.google.com",
        "appleid.apple.com"
    };

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Remove title bar
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        
        // Full screen
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        
        // Immersive mode for API 19+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            );
        }
        
        // Create WebView
        webView = new WebView(this);
        setContentView(webView);
        
        // Create and attach JavaScript bridge
        bridge = new BasePhoneBridge(this, this);
        webView.addJavascriptInterface(bridge, "Android");
        
        // Configure WebView settings
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        
        // Enable popups - critical for Base Account
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportMultipleWindows(true);
        
        // API level specific settings
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
            // Allow third-party cookies for auth
            android.webkit.CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(false);
        }
        
        // Handle page loading
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(url);
            }
            
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    return handleUrl(request.getUrl().toString());
                }
                return false;
            }
            
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                Log.d(TAG, "Page started: " + url);
            }
            
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "Page finished: " + url);
                
                // Inject notification that Android bridge is available
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    webView.evaluateJavascript(
                        "if(window.dispatchEvent) { window.dispatchEvent(new CustomEvent('androidBridgeReady')); }",
                        null
                    );
                    
                    // Inject helper to open auth URLs in Chrome
                    injectAuthHelper(view);
                }
            }
        });
        
        // Handle Chrome client events including popups
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                Log.d(TAG, "onCreateWindow called - popup requested");
                
                // Get the URL being opened
                WebView.HitTestResult result = view.getHitTestResult();
                String url = result.getExtra();
                
                if (url != null) {
                    Log.d(TAG, "Popup URL from HitTestResult: " + url);
                    if (shouldOpenInExternalBrowser(url)) {
                        openInChrome(url);
                        return false;
                    }
                }
                
                // Create a temporary WebView to capture the URL
                WebView tempWebView = new WebView(WebViewActivity.this);
                tempWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, String url) {
                        Log.d(TAG, "Popup navigating to: " + url);
                        if (shouldOpenInExternalBrowser(url)) {
                            openInChrome(url);
                        } else {
                            // Open other popups in external browser too for safety
                            openInChrome(url);
                        }
                        // Destroy temp webview
                        tempWebView.destroy();
                        return true;
                    }
                });
                
                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(tempWebView);
                resultMsg.sendToTarget();
                return true;
            }
            
            @Override
            public void onCloseWindow(WebView window) {
                Log.d(TAG, "onCloseWindow called");
            }
        });
        
        // Load the app
        webView.loadUrl(URL);
        
        // Request permissions on start (API 23+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            requestNecessaryPermissions();
        }
    }
    
    /**
     * Handle URL navigation - decide whether to load in WebView or external browser
     */
    private boolean handleUrl(String url) {
        Log.d(TAG, "handleUrl: " + url);
        
        if (url == null) return false;
        
        // Keep javascript: URLs in WebView
        if (url.startsWith("javascript:")) {
            return false;
        }
        
        // Keep our app URLs in WebView
        if (url.contains("baselauncher.vercel.app")) {
            return false;
        }
        
        // Auth domains should open in Chrome for passkey support
        if (shouldOpenInExternalBrowser(url)) {
            openInChrome(url);
            return true;
        }
        
        // Other external links open in browser
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Failed to open URL: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Check if URL should open in external browser (for auth)
     */
    private boolean shouldOpenInExternalBrowser(String url) {
        if (url == null) return false;
        String lowerUrl = url.toLowerCase();
        for (String domain : EXTERNAL_AUTH_DOMAINS) {
            if (lowerUrl.contains(domain)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Open URL in Chrome or default browser
     */
    private void openInChrome(String url) {
        Log.d(TAG, "Opening in Chrome: " + url);
        try {
            // Try Chrome first
            Intent chromeIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            chromeIntent.setPackage("com.android.chrome");
            chromeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(chromeIntent);
        } catch (Exception e) {
            Log.d(TAG, "Chrome not available, using default browser");
            // Fall back to default browser
            try {
                Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(browserIntent);
            } catch (Exception ex) {
                Log.e(TAG, "Failed to open browser: " + ex.getMessage());
            }
        }
    }
    
    /**
     * Inject JavaScript helper to intercept auth popups
     */
    private void injectAuthHelper(WebView view) {
        String js = 
            "(function() {" +
            "  if (window._authHelperInjected) return;" +
            "  window._authHelperInjected = true;" +
            "  " +
            "  // Override window.open to catch auth popups" +
            "  var originalOpen = window.open;" +
            "  window.open = function(url, name, features) {" +
            "    console.log('window.open intercepted:', url);" +
            "    if (url && (url.includes('keys.coinbase.com') || " +
            "                url.includes('wallet.coinbase.com') || " +
            "                url.includes('coinbase.com/signin') ||" +
            "                url.includes('accounts.google.com'))) {" +
            "      console.log('Opening auth URL in Chrome:', url);" +
            "      if (window.Android && window.Android.openUrl) {" +
            "        window.Android.openUrl(url);" +
            "        return null;" +
            "      }" +
            "    }" +
            "    return originalOpen.call(window, url, name, features);" +
            "  };" +
            "  " +
            "  console.log('Auth helper injected');" +
            "})();";
        
        view.evaluateJavascript(js, null);
    }
    
    private void requestNecessaryPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            String[] permissions = {
                android.Manifest.permission.READ_CONTACTS,
                android.Manifest.permission.CALL_PHONE,
                android.Manifest.permission.SEND_SMS
            };
            
            java.util.List<String> permissionsToRequest = new java.util.ArrayList<>();
            for (String permission : permissions) {
                if (checkSelfPermission(permission) != PackageManager.PERMISSION_GRANTED) {
                    permissionsToRequest.add(permission);
                }
            }
            
            if (!permissionsToRequest.isEmpty()) {
                requestPermissions(permissionsToRequest.toArray(new String[0]), BasePhoneBridge.PERMISSION_REQUEST_CODE);
            }
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == BasePhoneBridge.PERMISSION_REQUEST_CODE) {
            // Notify WebView that permissions may have changed
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                webView.evaluateJavascript(
                    "if(window.dispatchEvent) { window.dispatchEvent(new CustomEvent('permissionsUpdated')); }",
                    null
                );
            }
        }
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Handle deep links / callbacks from Chrome
        if (intent != null && intent.getData() != null) {
            String url = intent.getData().toString();
            Log.d(TAG, "onNewIntent with URL: " + url);
            if (url.contains("baselauncher.vercel.app")) {
                webView.loadUrl(url);
            }
        }
    }
    
    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            // Don't exit, we're a home launcher
            // Minimize the app instead
            moveTaskToBack(true);
        }
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Re-apply immersive mode when window gains focus
        if (hasFocus && Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            );
        }
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
            // Re-inject auth helper in case page was reloaded
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                injectAuthHelper(webView);
            }
        }
    }
    
    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.onPause();
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (webView != null) {
            webView.destroy();
        }
    }
}
