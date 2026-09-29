/* Independently computed HKDF-SHA256 (RFC 5869) reference vectors (Python
 * cryptography.hazmat.primitives.kdf.hkdf.HKDF, a completely separate implementation
 * from crypto_hkdf_sha256 in cen429_crypto.h). Generated once; do not hand-edit. */
#ifndef HKDF_VECTORS_H
#define HKDF_VECTORS_H

#define HV_MASTER_ENC_V1_32 "5a5ed417c87e3566eb618f5b2f74aba9a899c38beea15bf085a6f630d37002cb"
#define HV_MASTER_MAC_V1_32 "4c63a348654a076c93ac1cf58e1b48385f070ebd92e77d0f100f57f0ce1750e6"
#define HV_MASTER_CHAIN_1_32 "cbbe8fdd0b6ca8bec999d2c5f70700137ebceea6b6cc7b50add02b035a13b81d"
#define HV_RFC5869_TC1_42 "3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865"
#define HV_MASTER_CHAIN_2_32 "1113abf7352881e0648246c2a653afb26b2b068ffcab60a92fb3b61dcf3ea982"

#endif
