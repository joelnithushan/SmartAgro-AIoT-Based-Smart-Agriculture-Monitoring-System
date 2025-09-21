const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://smartagro-solution-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function updateFirebaseRules() {
  try {
    console.log('🔧 Updating Firebase Realtime Database rules...');
    
    // Current rules (what you have)
    const currentRules = {
      "rules": {
        "devices": {
          "$deviceId": {
            ".read": "auth != null",
            ".write": true,
            "sensors": {
              ".read": "auth != null",
              ".write": true
            },
            "irrigation": {
              ".read": "auth != null",
              ".write": "auth != null"
            }
          }
        },
        "test": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    };
    
    // New comprehensive rules
    const newRules = {
      "rules": {
        "devices": {
          "$deviceId": {
            // ESP32 can write sensor data without authentication
            "sensors": {
              ".read": "auth != null",
              ".write": true,
              
              "latest": {
                ".read": "auth != null",
                ".write": true
              },
              
              "history": {
                ".read": "auth != null",
                ".write": true,
                
                "$timestamp": {
                  ".read": "auth != null",
                  ".write": true
                }
              }
            },
            
            // Control paths require authentication
            "control": {
              ".read": "auth != null",
              ".write": "auth != null",
              
              "relay": {
                ".read": "auth != null",
                ".write": "auth != null"
              },
              
              "irrigation": {
                ".read": "auth != null",
                ".write": "auth != null"
              }
            },
            
            // Schedules require authentication
            "schedules": {
              ".read": "auth != null",
              ".write": "auth != null",
              
              "$scheduleId": {
                ".read": "auth != null",
                ".write": "auth != null"
              }
            },
            
            // Meta data requires authentication
            "meta": {
              ".read": "auth != null",
              ".write": "auth != null"
            },
            
            // Irrigation events require authentication
            "irrigation": {
              ".read": "auth != null",
              ".write": "auth != null",
              
              "events": {
                ".read": "auth != null",
                ".write": "auth != null",
                
                "$eventId": {
                  ".read": "auth != null",
                  ".write": "auth != null"
                }
              }
            },
            
            // Device status requires authentication
            "status": {
              ".read": "auth != null",
              ".write": "auth != null"
            },
            
            // Relay status requires authentication
            "relay": {
              ".read": "auth != null",
              ".write": "auth != null"
            }
          }
        },
        
        "users": {
          "$uid": {
            ".read": "auth != null && auth.uid == $uid",
            ".write": "auth != null && auth.uid == $uid",
            
            "devices": {
              ".read": "auth != null && auth.uid == $uid",
              ".write": "auth != null && auth.uid == $uid",
              
              "$deviceId": {
                ".read": "auth != null && auth.uid == $uid",
                ".write": "auth != null && auth.uid == $uid"
              }
            }
          }
        },
        
        "deviceRequests": {
          "$requestId": {
            ".read": "auth != null && (data.child('userId').val() == auth.uid || root.child('users').child(auth.uid).child('role').val() == 'admin')",
            ".write": "auth != null && (data.child('userId').val() == auth.uid || root.child('users').child(auth.uid).child('role').val() == 'admin')"
          }
        },
        
        "test": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    };
    
    // Deploy the new rules
    await admin.database().setRules(JSON.stringify(newRules));
    
    console.log('✅ Firebase Realtime Database rules updated successfully!');
    console.log('📋 Changes made:');
    console.log('   - Added comprehensive sensor data paths (latest, history)');
    console.log('   - Added control paths for relay and irrigation');
    console.log('   - Added schedule management paths');
    console.log('   - Added user management paths');
    console.log('   - Added device request paths');
    console.log('   - ESP32 can still write sensor data without authentication');
    console.log('   - Users can read sensor data with authentication');
    console.log('   - Control commands require authentication');
    
    console.log('\n🔐 Security model:');
    console.log('   - ESP32: Can write sensor data (no auth required)');
    console.log('   - Users: Can read sensor data (auth required)');
    console.log('   - Users: Can control devices (auth required)');
    console.log('   - Users: Can manage schedules (auth required)');
    console.log('   - Users: Can access their own profile data');
    console.log('   - Device requests protected by ownership');
    
    console.log('\n🎯 This should provide:');
    console.log('   1. Full functionality for the SmartAgro system');
    console.log('   2. Proper security for user data');
    console.log('   3. ESP32 compatibility for sensor data');
    console.log('   4. Complete control over irrigation system');
    
  } catch (error) {
    console.error('❌ Error updating Firebase rules:', error);
  } finally {
    process.exit(0);
  }
}

updateFirebaseRules();
