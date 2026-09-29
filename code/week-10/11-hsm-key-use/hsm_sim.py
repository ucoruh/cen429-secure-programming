#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CEN429 - Week 10 - Demo 11: a simulated Hardware Security Module (HSM), in the API shape of
# PKCS#11 -- the public standard interface (originally RSA Laboratories, now maintained by OASIS)
# that real HSMs and smart cards expose: keys are created and used through opaque HANDLES, and the
# private key material never crosses the API boundary at all. There is no C_ExportPrivateKey call in
# the PKCS#11 standard -- signing is the only thing you can DO with a private key, not something you
# can read.
#
# This class is a teaching stand-in, not a real cryptographic module: it runs in the same Python
# process as its caller, so nothing here is protected by real hardware. The point is the SHAPE of the
# API -- generate a handle, sign with a handle, never return the key -- which is exactly what a real
# HSM/PKCS#11 token, a TPM, or a cloud KMS (Key Management Service) all offer for the same reason.
import hashlib
import hmac
import os


class SimulatedHSM:
    """generate_keypair() -> handle (an opaque int). sign(handle, data) -> signature, computed
    INSIDE the object. get_public_key(handle) -> the public part only. There is deliberately no
    get_private_key() / export_key() method: the only way to use a private key is to ask this object
    to sign something with it."""

    def __init__(self):
        self._next_handle = 1
        self._private = {}   # handle -> private key bytes (never returned to a caller)
        self._public = {}    # handle -> public key bytes (safe to hand out)

    def generate_keypair(self):
        handle = self._next_handle
        self._next_handle += 1
        private_key = os.urandom(32)
        public_key = hashlib.sha256(private_key + b"|public").digest()  # a toy "derived public key"
        self._private[handle] = private_key
        self._public[handle] = public_key
        return handle

    def get_public_key(self, handle):
        if handle not in self._public:
            raise KeyError("no such key handle: %r" % handle)
        return self._public[handle]

    def sign(self, handle, data: bytes) -> bytes:
        """Computes a MAC-based "signature" using the private key held INSIDE this object -- the
        caller supplies only the handle and the data, never the key itself."""
        if handle not in self._private:
            raise KeyError("no such key handle: %r" % handle)
        return hmac.new(self._private[handle], data, hashlib.sha256).digest()

    def verify(self, handle, data: bytes, signature: bytes) -> bool:
        """Verification is intentionally NOT restricted to a handle you own: anyone holding the
        PUBLIC key material could verify a real asymmetric signature. This simulated scheme is
        symmetric (HMAC-based) for simplicity, so verification here still needs access to the same
        private key through the HSM -- a real PKCS#11 module would use RSA/EC keys instead, where
        verification only ever needs the public half."""
        if handle not in self._private:
            raise KeyError("no such key handle: %r" % handle)
        expected = hmac.new(self._private[handle], data, hashlib.sha256).digest()
        return hmac.compare_digest(expected, signature)

    def destroy_keypair(self, handle):
        """Deletes a key permanently -- afterward, even THIS object can no longer sign with it."""
        self._private.pop(handle, None)
        self._public.pop(handle, None)

    def public_api(self):
        """The list of method names this object exposes -- used by the tests to confirm there is no
        export/read-key style method on the public API surface."""
        return sorted(n for n in dir(self) if not n.startswith("_") and callable(getattr(self, n)))


def demo():
    hsm = SimulatedHSM()

    print("-- generate a key pair; only a HANDLE and the PUBLIC key ever leave the HSM --")
    h1 = hsm.generate_keypair()
    print("handle =", h1, " public key =", hsm.get_public_key(h1).hex()[:24], "...")

    print("\n-- sign with the handle; the private key itself is never seen outside sign() --")
    doc = b"purchase order #4711: pay 10000 to account A"
    sig = hsm.sign(h1, doc)
    print("signature =", sig.hex()[:24], "...")
    print("verify(h1, doc, sig) =", hsm.verify(h1, doc, sig))

    print("\n-- a tampered document fails verification --")
    print("verify(h1, doc + b'!', sig) =", hsm.verify(h1, doc + b"!", sig))

    print("\n-- a second, unrelated key pair: its signature does NOT verify under the first handle --")
    h2 = hsm.generate_keypair()
    sig2 = hsm.sign(h2, doc)
    print("verify(h1, doc, sig-from-h2) =", hsm.verify(h1, doc, sig2))

    print("\n-- the public API never offers a way to read the private key out --")
    print("public_api() =", hsm.public_api())
    print("(no 'get_private_key', no 'export_key' -- the only operation on a private key is 'sign')")

    print("\n-- destroying a key handle makes it unusable, even for the HSM itself --")
    hsm.destroy_keypair(h1)
    try:
        hsm.sign(h1, doc)
        print("unexpected: signed with a destroyed handle")
    except KeyError as e:
        print("sign(h1, ...) after destroy_keypair(h1) raises:", e)


if __name__ == "__main__":
    demo()
