module.exports = {
  expo: {
    name: "SpendOrbit",
    slug: "spendorbit",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/512.png",
    userInterfaceStyle: "light",
    splash: {
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    android: {
      package: "com.digitalfied.spendorbit",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/1024.png",
        backgroundColor: "#1C1C1E"
      },
      permissions: [],
      statusBar: {
        barStyle: "light-content",
        backgroundColor: "#1C1C1E"
      }
    },
    plugins: [
      "expo-font",
      [
        "expo-build-properties",
        {
          android: {
            gradleProperties: {
              "org.gradle.jvmargs": "-Xmx4096m -XX:MaxMetaspaceSize=512m",
              "android.useAndroidX": "true",
              "android.enableJetifier": "true"
            },
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            minSdkVersion: 23,
            buildToolsVersion: "34.0.0"
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "7050b3d1-9aa9-4190-8b26-b0e661d74b9d"
      }
    }
  }
};

