/*
 * BasePhone WebView Activity
 * Custom WebView with JavaScript bridge for native functionality
 */
package app.vercel.baselauncher.twa;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.Dialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.util.Log;

public class WebViewActivity extends Activity {
    private static final String TAG = "WebViewActivity";
    private WebView webView;
    private BasePhoneBridge bridge;
    private static final String URL = "https://baselauncher.vercel.app";
    
    // Auth popup dialog
    private Dialog authDialog;
    private WebView authWebView;
    
    // Domains that need special handling for auth
    private static final String[] AUTH_DOMAINS = {
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
                    
                    // Apply any pending wallet address from deep link
                    applyPendingWalletAddress();
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
                }
                
                // Create an in-app popup WebView for auth
                showAuthPopup(resultMsg);
                return true;
            }
            
            @Override
            public void onCloseWindow(WebView window) {
                Log.d(TAG, "onCloseWindow called");
                closeAuthPopup();
            }
        });
        
        // Load the app
        webView.loadUrl(URL);
        
        // Request permissions on start (API 23+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            requestNecessaryPermissions();
        }
        
        // Check if launched with a deep link intent
        handleIntent(getIntent());
    }
    
    // Store pending wallet address to save after page loads
    private String pendingWalletAddress = null;
    
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
        for (String domain : AUTH_DOMAINS) {
            if (lowerUrl.contains(domain)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Show in-app auth popup browser
     */
    @SuppressLint("SetJavaScriptEnabled")
    private void showAuthPopup(Message resultMsg) {
        Log.d(TAG, "Showing auth popup");
        
        // Create dialog
        authDialog = new Dialog(this, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
        authDialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        authDialog.setCancelable(true);
        
        // Create layout
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(Color.WHITE);
        
        // Header bar with close button
        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setBackgroundColor(Color.parseColor("#0052FF"));
        header.setPadding(16, 16, 16, 16);
        
        // Title
        TextView title = new TextView(this);
        title.setText("Connect Wallet");
        title.setTextColor(Color.WHITE);
        title.setTextSize(18);
        title.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        header.addView(title);
        
        // Close button
        TextView closeBtn = new TextView(this);
        closeBtn.setText("✕");
        closeBtn.setTextColor(Color.WHITE);
        closeBtn.setTextSize(24);
        closeBtn.setPadding(16, 0, 16, 0);
        closeBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                closeAuthPopup();
            }
        });
        header.addView(closeBtn);
        
        layout.addView(header, new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 
            LinearLayout.LayoutParams.WRAP_CONTENT
        ));
        
        // Progress bar
        final ProgressBar progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setIndeterminate(true);
        progressBar.setVisibility(View.VISIBLE);
        layout.addView(progressBar, new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            8
        ));
        
        // Create auth WebView
        authWebView = new WebView(this);
        authWebView.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.MATCH_PARENT
        ));
        
        // Configure WebView settings for auth
        WebSettings settings = authWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportMultipleWindows(true);
        settings.setUserAgentString(settings.getUserAgentString().replace("; wv", "")); // Remove WebView marker
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            CookieManager.getInstance().setAcceptThirdPartyCookies(authWebView, true);
        }
        
        // Handle page events
        authWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                Log.d(TAG, "Auth popup page started: " + url);
                progressBar.setVisibility(View.VISIBLE);
                
                // Check for callback URL with wallet address
                if (url.contains("callback") && url.contains("address=")) {
                    Uri uri = Uri.parse(url);
                    String address = uri.getQueryParameter("address");
                    if (address != null && !address.isEmpty()) {
                        Log.d(TAG, "Got wallet address from auth: " + address);
                        saveWalletAddress(address);
                        closeAuthPopup();
                    }
                }
            }
            
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "Auth popup page finished: " + url);
                progressBar.setVisibility(View.GONE);
                
                // Inject script to handle successful auth
                injectAuthSuccessHandler(view);
            }
            
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                Log.d(TAG, "Auth popup URL loading: " + url);
                
                // Check for our callback with address
                if (url.startsWith("basephone://") || url.contains("callback")) {
                    Uri uri = Uri.parse(url);
                    String address = uri.getQueryParameter("address");
                    if (address != null && !address.isEmpty()) {
                        Log.d(TAG, "Received wallet address: " + address);
                        saveWalletAddress(address);
                        closeAuthPopup();
                        return true;
                    }
                }
                
                // Allow auth domains to load in popup
                return false;
            }
        });
        
        // Handle nested popups
        authWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                Log.d(TAG, "Auth popup requesting nested popup");
                // Allow nested popups for OAuth flows
                WebView nestedWebView = new WebView(WebViewActivity.this);
                nestedWebView.getSettings().setJavaScriptEnabled(true);
                nestedWebView.getSettings().setDomStorageEnabled(true);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    CookieManager.getInstance().setAcceptThirdPartyCookies(nestedWebView, true);
                }
                
                nestedWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, String url) {
                        Log.d(TAG, "Nested popup URL: " + url);
                        if (url.contains("callback") || url.startsWith("basephone://")) {
                            Uri uri = Uri.parse(url);
                            String address = uri.getQueryParameter("address");
                            if (address != null && !address.isEmpty()) {
                                saveWalletAddress(address);
                                closeAuthPopup();
                                return true;
                            }
                        }
                        return false;
                    }
                });
                
                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(nestedWebView);
                resultMsg.sendToTarget();
                return true;
            }
            
            @Override
            public void onCloseWindow(WebView window) {
                Log.d(TAG, "Nested popup closed");
            }
        });
        
        layout.addView(authWebView);
        
        // Set dialog content
        authDialog.setContentView(layout);
        authDialog.setOnDismissListener(dialog -> {
            Log.d(TAG, "Auth dialog dismissed");
            if (authWebView != null) {
                authWebView.destroy();
                authWebView = null;
            }
        });
        
        // Connect the popup WebView
        WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
        transport.setWebView(authWebView);
        resultMsg.sendToTarget();
        
        // Show dialog
        authDialog.show();
    }
    
    /**
     * Inject script to detect successful auth and extract wallet address
     */
    private void injectAuthSuccessHandler(WebView view) {
        String js = 
            "(function() {" +
            "  // Watch for wallet address in localStorage" +
            "  var checkInterval = setInterval(function() {" +
            "    var address = localStorage.getItem('baseAccount_address');" +
            "    if (address && address.startsWith('0x')) {" +
            "      console.log('Wallet connected:', address);" +
            "      clearInterval(checkInterval);" +
            "      // Notify parent via URL" +
            "      window.location.href = 'basephone://auth?address=' + encodeURIComponent(address);" +
            "    }" +
            "  }, 500);" +
            "  " +
            "  // Clear after 60 seconds" +
            "  setTimeout(function() { clearInterval(checkInterval); }, 60000);" +
            "})();";
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            view.evaluateJavascript(js, null);
        }
    }
    
    /**
     * Close auth popup dialog
     */
    private void closeAuthPopup() {
        Log.d(TAG, "Closing auth popup");
        if (authDialog != null && authDialog.isShowing()) {
            authDialog.dismiss();
        }
        authDialog = null;
        if (authWebView != null) {
            authWebView.destroy();
            authWebView = null;
        }
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
     * Inject JavaScript helper to handle auth flows
     */
    private void injectAuthHelper(WebView view) {
        String js = 
            "(function() {" +
            "  if (window._authHelperInjected) return;" +
            "  window._authHelperInjected = true;" +
            "  " +
            "  // Listen for wallet connection events" +
            "  window.addEventListener('walletConnected', function(e) {" +
            "    console.log('walletConnected event received');" +
            "  });" +
            "  " +
            "  console.log('Auth helper injected - using in-app browser');" +
            "})();";
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            view.evaluateJavascript(js, null);
        }
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
        setIntent(intent);
        handleIntent(intent);
    }
    
    /**
     * Handle incoming intents (deep links, auth callbacks)
     */
    private void handleIntent(Intent intent) {
        if (intent == null || intent.getData() == null) return;
        
        Uri uri = intent.getData();
        String url = uri.toString();
        Log.d(TAG, "handleIntent with URL: " + url);
        
        // Handle basephone:// custom scheme callback
        if ("basephone".equals(uri.getScheme())) {
            String address = uri.getQueryParameter("address");
            if (address != null && !address.isEmpty()) {
                Log.d(TAG, "Received wallet address from callback: " + address);
                // Save to WebView localStorage and notify app
                saveWalletAddress(address);
            }
            return;
        }
        
        // Handle https://baselauncher.vercel.app/callback?address=...
        if (url.contains("baselauncher.vercel.app/callback")) {
            String address = uri.getQueryParameter("address");
            if (address != null && !address.isEmpty()) {
                Log.d(TAG, "Received wallet address from web callback: " + address);
                saveWalletAddress(address);
            }
            return;
        }
        
        // Handle other baselauncher URLs
        if (url.contains("baselauncher.vercel.app")) {
            webView.loadUrl(url);
        }
    }
    
    /**
     * Save wallet address to WebView localStorage and notify the app
     */
    private void saveWalletAddress(final String address) {
        Log.d(TAG, "saveWalletAddress called with: " + address);
        
        // Store for later in case page isn't ready
        pendingWalletAddress = address;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && webView != null) {
            // Inject the address save script
            String js = String.format(
                "(function() {" +
                "  try {" +
                "    localStorage.setItem('baseAccount_address', '%s');" +
                "    localStorage.setItem('baseAccount_connected', 'true');" +
                "    localStorage.setItem('baseAccount_setupComplete', 'true');" +
                "    console.log('Wallet address saved from Android:', '%s');" +
                "    " +
                "    // Dispatch event to notify React app" +
                "    if(window.dispatchEvent) {" +
                "      window.dispatchEvent(new CustomEvent('walletConnected', { detail: { address: '%s' } }));" +
                "    }" +
                "    " +
                "    // Force reload to pick up the new state" +
                "    setTimeout(function() { window.location.reload(); }, 100);" +
                "  } catch(e) { console.error('Failed to save wallet:', e); }" +
                "})();",
                address, address, address
            );
            webView.evaluateJavascript(js, null);
        }
    }
    
    /**
     * Apply any pending wallet address after page loads
     */
    private void applyPendingWalletAddress() {
        if (pendingWalletAddress != null && !pendingWalletAddress.isEmpty()) {
            Log.d(TAG, "Applying pending wallet address: " + pendingWalletAddress);
            final String address = pendingWalletAddress;
            pendingWalletAddress = null; // Clear to avoid double-apply
            
            // Small delay to ensure page is ready
            webView.postDelayed(new Runnable() {
                @Override
                public void run() {
                    saveWalletAddress(address);
                }
            }, 500);
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
