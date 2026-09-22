/*
 * CEN429 - Hafta 9 - Demo 1: Manuel gizleme ve maliyet olcumu (ORTAK ARAYUZ)
 *
 * Iki surum ayni arayuzu uygular:
 *   erisim_ver(jeton) -> gecerli sentetik jeton icin IZIN, degilse RED.
 * temiz.c : okunur, korumasiz surum.
 * gizli.c : ayni davranis; el ile duzlestirme + opak yuklem + kodlanmis sabit.
 *
 * GUVENLIK: Ornek tumuyle sentetiktir; ogrencinin bilgisayarina zarar vermez.
 * Dosya/ag/sistem islemi yoktur; yalniz kendi bellek/hesabini kullanir.
 */
#ifndef CEN429_H9_ORTAK_H
#define CEN429_H9_ORTAK_H

#define IZIN 1
#define RED  0

/* Gecerli sentetik jeton (gercek bir sir DEGIL): "CEN429-OK" */
int erisim_ver(const char *jeton);

#endif
