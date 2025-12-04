/*
 * BasePhone JavaScript Bridge
 * Provides native Android functionality to the web app
 */
package app.vercel.baselauncher.twa;

import android.Manifest;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.ContactsContract;
import android.provider.AlarmClock;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import android.location.Location;
import android.location.LocationManager;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;
import java.util.ArrayList;

public class BasePhoneBridge {
    private static final String TAG = "BasePhoneBridge";
    private Context context;
    private Activity activity;
    
    public static final int PERMISSION_REQUEST_CODE = 1001;

    public BasePhoneBridge(Context context, Activity activity) {
        this.context = context;
        this.activity = activity;
    }

    /**
     * Launch an app by package name
     */
    @JavascriptInterface
    public boolean launchApp(String packageName) {
        try {
            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(packageName);
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(launchIntent);
                return true;
            } else {
                Log.w(TAG, "App not installed: " + packageName);
                return false;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error launching app: " + e.getMessage());
            return false;
        }
    }

    /**
     * Check if an app is installed
     */
    @JavascriptInterface
    public boolean isAppInstalled(String packageName) {
        try {
            context.getPackageManager().getPackageInfo(packageName, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    /**
     * Get list of installed apps (launcher apps only)
     */
    @JavascriptInterface
    public String getInstalledApps() {
        JSONArray apps = new JSONArray();
        try {
            Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
            mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);
            
            PackageManager pm = context.getPackageManager();
            List<ResolveInfo> resolveInfos = pm.queryIntentActivities(mainIntent, 0);
            
            for (ResolveInfo resolveInfo : resolveInfos) {
                try {
                    JSONObject app = new JSONObject();
                    String packageName = resolveInfo.activityInfo.packageName;
                    app.put("packageName", packageName);
                    app.put("appName", resolveInfo.loadLabel(pm).toString());
                    app.put("isSystemApp", (resolveInfo.activityInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
                    apps.put(app);
                } catch (JSONException e) {
                    Log.e(TAG, "Error adding app to list: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting installed apps: " + e.getMessage());
        }
        return apps.toString();
    }

    /**
     * Make a phone call
     */
    @JavascriptInterface
    public boolean makeCall(String phoneNumber) {
        try {
            // Clean the phone number
            String cleanNumber = phoneNumber.replaceAll("[^0-9+]", "");
            
            if (hasPermission(Manifest.permission.CALL_PHONE)) {
                Intent callIntent = new Intent(Intent.ACTION_CALL);
                callIntent.setData(Uri.parse("tel:" + cleanNumber));
                callIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(callIntent);
                return true;
            } else {
                // Fall back to dial intent (doesn't require permission)
                Intent dialIntent = new Intent(Intent.ACTION_DIAL);
                dialIntent.setData(Uri.parse("tel:" + cleanNumber));
                dialIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(dialIntent);
                requestPermission(Manifest.permission.CALL_PHONE);
                return true;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error making call: " + e.getMessage());
            return false;
        }
    }

    /**
     * Send SMS message
     */
    @JavascriptInterface
    public boolean sendSMS(String phoneNumber, String message) {
        try {
            String cleanNumber = phoneNumber.replaceAll("[^0-9+]", "");
            
            // Use SMS intent (works without permission, opens messaging app)
            Intent smsIntent = new Intent(Intent.ACTION_SENDTO);
            smsIntent.setData(Uri.parse("smsto:" + cleanNumber));
            smsIntent.putExtra("sms_body", message);
            smsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(smsIntent);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error sending SMS: " + e.getMessage());
            return false;
        }
    }

    /**
     * Send WhatsApp message
     */
    @JavascriptInterface
    public boolean sendWhatsApp(String phoneNumber, String message) {
        try {
            // Remove all non-digit chars except +
            String cleanNumber = phoneNumber.replaceAll("[^0-9+]", "");
            // Remove leading + for WhatsApp
            if (cleanNumber.startsWith("+")) {
                cleanNumber = cleanNumber.substring(1);
            }
            
            // Try direct WhatsApp intent first
            Intent whatsappIntent = new Intent(Intent.ACTION_VIEW);
            String url = "https://api.whatsapp.com/send?phone=" + cleanNumber + "&text=" + Uri.encode(message);
            whatsappIntent.setData(Uri.parse(url));
            whatsappIntent.setPackage("com.whatsapp");
            whatsappIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            if (isAppInstalled("com.whatsapp")) {
                context.startActivity(whatsappIntent);
                return true;
            } else {
                // Try WhatsApp Business
                whatsappIntent.setPackage("com.whatsapp.w4b");
                if (isAppInstalled("com.whatsapp.w4b")) {
                    context.startActivity(whatsappIntent);
                    return true;
                }
                // Open in browser as fallback
                whatsappIntent.setPackage(null);
                context.startActivity(whatsappIntent);
                return true;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending WhatsApp: " + e.getMessage());
            return false;
        }
    }

    /**
     * Search contacts by name
     */
    @JavascriptInterface
    public String searchContacts(String query) {
        JSONArray contacts = new JSONArray();
        
        if (!hasPermission(Manifest.permission.READ_CONTACTS)) {
            requestPermission(Manifest.permission.READ_CONTACTS);
            return contacts.toString();
        }
        
        try {
            ContentResolver cr = context.getContentResolver();
            String selection = ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " LIKE ?";
            String[] selectionArgs = new String[]{"%" + query + "%"};
            
            Cursor cursor = cr.query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                new String[]{
                    ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                    ContactsContract.CommonDataKinds.Phone.NUMBER,
                    ContactsContract.CommonDataKinds.Phone.TYPE
                },
                selection,
                selectionArgs,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
            );
            
            if (cursor != null) {
                while (cursor.moveToNext()) {
                    try {
                        JSONObject contact = new JSONObject();
                        contact.put("id", cursor.getString(0));
                        contact.put("name", cursor.getString(1));
                        contact.put("phone", cursor.getString(2));
                        contact.put("type", getPhoneTypeLabel(cursor.getInt(3)));
                        contacts.put(contact);
                    } catch (JSONException e) {
                        Log.e(TAG, "Error parsing contact: " + e.getMessage());
                    }
                }
                cursor.close();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error searching contacts: " + e.getMessage());
        }
        
        return contacts.toString();
    }

    /**
     * Get all contacts (limited to first 100)
     */
    @JavascriptInterface
    public String getContacts() {
        JSONArray contacts = new JSONArray();
        
        if (!hasPermission(Manifest.permission.READ_CONTACTS)) {
            requestPermission(Manifest.permission.READ_CONTACTS);
            return contacts.toString();
        }
        
        try {
            ContentResolver cr = context.getContentResolver();
            Cursor cursor = cr.query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                new String[]{
                    ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                    ContactsContract.CommonDataKinds.Phone.NUMBER,
                    ContactsContract.CommonDataKinds.Phone.TYPE
                },
                null,
                null,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC LIMIT 100"
            );
            
            if (cursor != null) {
                while (cursor.moveToNext()) {
                    try {
                        JSONObject contact = new JSONObject();
                        contact.put("id", cursor.getString(0));
                        contact.put("name", cursor.getString(1));
                        contact.put("phone", cursor.getString(2));
                        contact.put("type", getPhoneTypeLabel(cursor.getInt(3)));
                        contacts.put(contact);
                    } catch (JSONException e) {
                        Log.e(TAG, "Error parsing contact: " + e.getMessage());
                    }
                }
                cursor.close();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting contacts: " + e.getMessage());
        }
        
        return contacts.toString();
    }

    /**
     * Open navigation to an address
     */
    @JavascriptInterface
    public boolean navigateTo(String destination) {
        try {
            Uri gmmIntentUri = Uri.parse("google.navigation:q=" + Uri.encode(destination));
            Intent mapIntent = new Intent(Intent.ACTION_VIEW, gmmIntentUri);
            mapIntent.setPackage("com.google.android.apps.maps");
            mapIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            if (isAppInstalled("com.google.android.apps.maps")) {
                context.startActivity(mapIntent);
            } else {
                // Fallback to browser
                Uri webUri = Uri.parse("https://www.google.com/maps/search/?api=1&query=" + Uri.encode(destination));
                Intent webIntent = new Intent(Intent.ACTION_VIEW, webUri);
                webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(webIntent);
            }
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error navigating: " + e.getMessage());
            return false;
        }
    }

    /**
     * Set an alarm
     */
    @JavascriptInterface
    public boolean setAlarm(int hour, int minute, String label) {
        try {
            Intent alarmIntent = new Intent(AlarmClock.ACTION_SET_ALARM);
            alarmIntent.putExtra(AlarmClock.EXTRA_HOUR, hour);
            alarmIntent.putExtra(AlarmClock.EXTRA_MINUTES, minute);
            if (label != null && !label.isEmpty()) {
                alarmIntent.putExtra(AlarmClock.EXTRA_MESSAGE, label);
            }
            alarmIntent.putExtra(AlarmClock.EXTRA_SKIP_UI, false);
            alarmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(alarmIntent);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error setting alarm: " + e.getMessage());
            return false;
        }
    }

    /**
     * Set a timer
     */
    @JavascriptInterface
    public boolean setTimer(int seconds, String label) {
        try {
            Intent timerIntent = new Intent(AlarmClock.ACTION_SET_TIMER);
            timerIntent.putExtra(AlarmClock.EXTRA_LENGTH, seconds);
            if (label != null && !label.isEmpty()) {
                timerIntent.putExtra(AlarmClock.EXTRA_MESSAGE, label);
            }
            timerIntent.putExtra(AlarmClock.EXTRA_SKIP_UI, false);
            timerIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(timerIntent);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error setting timer: " + e.getMessage());
            return false;
        }
    }

    /**
     * Open contacts app
     */
    @JavascriptInterface
    public boolean openContacts() {
        try {
            Intent contactsIntent = new Intent(Intent.ACTION_VIEW);
            contactsIntent.setData(ContactsContract.Contacts.CONTENT_URI);
            contactsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(contactsIntent);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error opening contacts: " + e.getMessage());
            return false;
        }
    }

    /**
     * Open URL in browser
     */
    @JavascriptInterface
    public boolean openUrl(String url) {
        try {
            String fullUrl = url;
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                fullUrl = "https://" + url;
            }
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(fullUrl));
            browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(browserIntent);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error opening URL: " + e.getMessage());
            return false;
        }
    }

    /**
     * Search the web
     */
    @JavascriptInterface
    public boolean searchWeb(String query) {
        try {
            String searchUrl = "https://www.google.com/search?q=" + Uri.encode(query);
            Intent searchIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(searchUrl));
            searchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(searchIntent);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error searching web: " + e.getMessage());
            return false;
        }
    }

    /**
     * Show a toast message
     */
    @JavascriptInterface
    public void showToast(String message) {
        activity.runOnUiThread(() -> {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
        });
    }

    /**
     * Request a permission
     */
    @JavascriptInterface
    public void requestPermissions() {
        String[] permissions = {
            Manifest.permission.READ_CONTACTS,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.SEND_SMS
        };
        ActivityCompat.requestPermissions(activity, permissions, PERMISSION_REQUEST_CODE);
    }

    // Helper methods
    private boolean hasPermission(String permission) {
        return ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestPermission(String permission) {
        ActivityCompat.requestPermissions(activity, new String[]{permission}, PERMISSION_REQUEST_CODE);
    }

    private String getPhoneTypeLabel(int type) {
        switch (type) {
            case ContactsContract.CommonDataKinds.Phone.TYPE_HOME:
                return "home";
            case ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE:
                return "mobile";
            case ContactsContract.CommonDataKinds.Phone.TYPE_WORK:
                return "work";
            default:
                return "other";
        }
    }
}
