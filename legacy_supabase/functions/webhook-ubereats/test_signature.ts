import { crypto } from "jsr:@std/crypto";
import { encodeHex } from "jsr:@std/encoding/hex";
import { assertEquals } from "jsr:@std/assert";

const MOCK_SECRET = "my_uber_secret_123";

async function sign(body: string, secret: string) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign("HMAC", key, enc.encode(body));
    return encodeHex(signatureBytes);
}

// Mocking the verification logic for local test
async function verify(body: string, signature: string, secret: string) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
    );

    // In real function we re-calc, here we cheat a bit but conceptually same
    // Actually let's replicate exact verify logic
    const calculatedSig = await sign(body, secret);
    return calculatedSig === signature;
}

Deno.test("HMAC Verification - Success", async () => {
    const payload = '{"event":"order_created"}';
    const sig = await sign(payload, MOCK_SECRET);

    const isValid = await verify(payload, sig, MOCK_SECRET);
    assertEquals(isValid, true);
    console.log("✅ Valid Signature Accepted");
});

Deno.test("HMAC Verification - Failure (Wrong Secret)", async () => {
    const payload = '{"event":"order_created"}';
    const sig = await sign(payload, "WRONG_SECRET"); // Signed with wrong key

    const isValid = await verify(payload, sig, MOCK_SECRET);
    assertEquals(isValid, false);
    console.log("✅ Invalid Secret Rejected");
});

Deno.test("HMAC Verification - Failure (Tampered Body)", async () => {
    const payload = '{"event":"order_created"}';
    const sig = await sign(payload, MOCK_SECRET);

    const tampered = payload + " "; // Add space
    const isValid = await verify(tampered, sig, MOCK_SECRET);
    assertEquals(isValid, false);
    console.log("✅ Tampered Body Rejected");
});
