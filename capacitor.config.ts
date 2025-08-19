import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'no.tl.sjekkid',
  appName: 'SJEKK ID',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: ["camera", "photos", "microphone"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav"
    }
  }
};

export default config;