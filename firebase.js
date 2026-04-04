const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: "elkhulasa-bot",
      private_key_id: "bc2533ae6b39df2738dc0ba48a55d5b7971314d6",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGLhwCykEPxQfy\n82Qy2IW+lxvzwzg1BhP8pl5Jlz8qqAUuS91VGPKuLia10HKl53jpnUHX+MtL8/2b\nxL7y/Ga+FMPCuTG10lIpLG4VTM8DGo+ifboVaLXNwL0fiIuoLf6JFrn1Y910t6DS\nFuyAeihaDXCspVDGg8/xChufN3wzMxQV76EyakjJhEk3Q5994nz+EwxFMS/R83He\nS0Kw7BcqhD0iFjqZbnwBHLnHeaoJtpc00ZEahYZ56iEQpAooDpx+klO/EAm0rxMM\nUgaZaHtxif3wMK6PjaXx4fEs/GEZxSWzDGFXrntySth//YqRGIJ1XCS5GqyJLc1U\nd7dTq3zFAgMBAAECggEAK5HZEir1pVonvnvQoFYWh1mQ6WVWvt+Mdtv7uDmih0YD\nx5MhwLL4rZ8TXx8KCZvraw7p+immRldIvx2A7opbqzgE9tNA0MzBx/AO7qthirjk\n8bArAEhySd8xJRTfwVSFVI3UydSQDDhPyMiF69QPeYbhae95Y/94MLHMc1NfQKD7\ngh70nWjDjbXCcwZRSBfwCnBmqGiV8UAGJmoPL0ABIO+ZiJnbM+UVIjyKUGmioZu3\nflTdeJSrcnZXMUvf3bnavZXpBojkaQgTQm2VM06rpIAIo6TrDHLs5FeoRMy71gmX\n5bfPXvesoijwjEs4aZ02er84aKIFoaaWpndO5h8/uQKBgQD16u65dbWdJiFEdMVd\nNXWwgxW+LoGTWQfc9bTqAFEbUjF5cJtmBn7eqtSmBVHF0z/J8u16MZjvODJRS/jg\nZhtzrgNjWPcWRd2lvniEm7KaRB9kkjD6JlkRG0vhUwRwp5jsrWfx5l9xQfFH1+V/\n8vscSIWxzbRVKL5QIbDlReapCQKBgQDOTiO9JWqzPkQNIK7yEXdGWb9RDODdm1mZ\ntPbZcjcvcXQnnDkLfTkuSvJ596VlhD1v8g8pYnqMjKSvvDpRdkPMW4wScmu2nsTF\ncdTytxB5GKJR+5HcrLkE+4h0U/X28bEqXx7mv0JDWsgzQK1iI6rOKkjUWcuoBnO4\npdO3vuMQ3QKBgHxCUIv/sVwNt0Oa6Vs2txgQtHzbjPfCRdndgaO3s0Pl3T/qqWr9\nH0At+7ND/tTB8Hp/uIVE6Gz/7VTs2X2xum9SXz3k5z0m4l9shgMjlTSj9WThBcRw\nehLNwyLAyv6NgRUebeZqLJHS6zMNIVbslPvunTeBpHxfUQK2c2b2Uh3ZAoGAOJSp\nrJh0eRBcrZUHJhCwO7UliV8U1PJkUomVIfH3PKXLC4oHAyWm5xFbCyRmUj9AclFa\n4yjFH4L7L89Z1zmuQn/hHLYQ4JcOtHARzTdz5yJgckeiq3kbjUhHFlBopv+GbW6F\nFRfjXoGpYpUceEv77mseak7uUfjjCANC26QYtmkCgYEAwBuRctTP6FK39UhjHRyG\nYxx1FIMpRWkMuF7nrxD3lA+AkFU2Fp2JROoeUFdWRoZcOxXNKyafVHo+7QzUWOs5\nHWqG3NEUJ5a1zmdm3pHFQTf3w/wgapQkZs0KgStn+v1hKzkMdQm4bEunzCZLxniA\n+eeqPdu+/vfwwsyub4/cccE=\n-----END PRIVATE KEY-----\n",
      client_email: "firebase-adminsdk-fbsvc@elkhulasa-bot.iam.gserviceaccount.com",
      client_id: "109797348648063708710",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40elkhulasa-bot.iam.gserviceaccount.com",
    }),
    databaseURL: "https://elkhulasa-bot-default-rtdb.firebaseio.com",
  });
}

const db = admin.database();
module.exports = db;
