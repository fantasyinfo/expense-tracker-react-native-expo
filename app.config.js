module.exports = {
  expo: {
    name: "Kharcha",
    slug: "expensetracker",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    android: {
      package: "com.gauravsharma.expensetracker",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
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
              "org.gradle.jvmargs": "-Xmx4096m -XX:MaxMetaspaceSize=512m"
            }
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

