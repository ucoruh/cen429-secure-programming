set(CEN429_FOLDER "Week 03/01 AES-GCM file")
# Crypto: OpenSSL on Linux, the operating system's own BCrypt CNG library on Windows.
cen429_add_demo(aes_gcm_file SOURCES aes_gcm_file.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)

# --- Tests ------------------------------------------------------------------------------------
# Unit tests: encrypt_file()/decrypt_file()/read_file()/write_file() are all bounded, safe to call
# in-process (see tests/test_aes_gcm_file.c for what is and is not exercised in-process).
cen429_add_demo(test_aes_gcm_file SOURCES tests/test_aes_gcm_file.c MODE secure
             LIBS $<IF:$<PLATFORM_ID:Windows>,bcrypt,crypto>)
cen429_test(NAME week-03/01-aes-gcm-file/unit COMMAND test_aes_gcm_file
            PASS_REGEX "0 failures")

# End-to-end: run the real compiled binary. "encrypt" writes a fresh ciphertext from a checked-in
# plaintext fixture; "decrypt" reads a ciphertext fixture produced by a DIFFERENT AES-256-GCM
# implementation (Python's `cryptography`, see tests/fixtures/secret.enc) and must recover the
# exact original bytes; the two "tampered" fixtures must be REJECTED (exit code 2).
cen429_test(NAME week-03/01-aes-gcm-file/encrypt-e2e
            COMMAND aes_gcm_file encrypt tests/fixtures/key32.bin tests/fixtures/plain.txt bin/e2e-cipher.bin
            PASS_REGEX "Encrypted: .*-> .*\\([0-9]+ bytes of ciphertext")
cen429_test(NAME week-03/01-aes-gcm-file/decrypt-cross-impl-e2e
            COMMAND aes_gcm_file decrypt tests/fixtures/key32.bin tests/fixtures/secret.enc bin/e2e-plain.txt
            PASS_REGEX "Decrypted and VERIFIED: .*-> .*\\(54 bytes\\)")
cen429_test(NAME week-03/01-aes-gcm-file/decrypt-tampered-ct-rejected-e2e
            COMMAND aes_gcm_file decrypt tests/fixtures/key32.bin tests/fixtures/tampered_ct.enc bin/e2e-should-not-exist-1.txt
            PASS_REGEX "VERIFICATION FAILED")
cen429_test(NAME week-03/01-aes-gcm-file/decrypt-tampered-tag-rejected-e2e
            COMMAND aes_gcm_file decrypt tests/fixtures/key32.bin tests/fixtures/tampered_tag.enc bin/e2e-should-not-exist-2.txt
            PASS_REGEX "VERIFICATION FAILED")
