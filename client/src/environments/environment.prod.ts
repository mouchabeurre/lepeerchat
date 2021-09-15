export const environment = {
  production: true,
  backend: {
    host: "www.lepeerchat.xyz",
    pathname: "ws",
    port: 443
  },
  iceServers: [
    {
      urls: [
        "stun:stun1.l.google.com:19302"
        // "stun:stun2.l.google.com:19305"
      ]
    }
  ]
}
