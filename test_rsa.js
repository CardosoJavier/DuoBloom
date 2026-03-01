import crypto from 'react-native-quick-crypto';
crypto.generateKeyPair(
        "rsa",
        {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: "spki",
            format: "pem",
          },
          privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
          },
        },
        (err, publicKey, privateKey) => {
          console.log("PUB:", typeof publicKey, publicKey ? "EXISTS" : "MISSING");
          console.log("PRIV:", typeof privateKey, privateKey ? "EXISTS" : "MISSING");
          if(publicKey && publicKey.export) console.log("HAS EXPORT");
        }
);
