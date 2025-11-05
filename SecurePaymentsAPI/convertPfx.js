import fs from "fs";
import forge from "node-forge";

const pfx = fs.readFileSync("./certs/localhost.pfx");
const password = "password";

const p12Asn1 = forge.asn1.fromDer(pfx.toString("binary"));
const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

let key, cert;
for (const safeContent of p12.safeContents) {
    for (const safeBag of safeContent.safeBags) {
        if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
            key = forge.pki.privateKeyToPem(safeBag.key);
        } else if (safeBag.type === forge.pki.oids.certBag) {
            cert = forge.pki.certificateToPem(safeBag.cert);
        }
    }
}

fs.writeFileSync("./certs/key.pem", key);
fs.writeFileSync("./certs/cert.pem", cert);
console.log("✅ PEM files created successfully");
