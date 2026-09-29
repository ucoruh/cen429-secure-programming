set(CEN429_FOLDER "Week 03/06 TLS verification and pinning")
# The TLS demo is Linux/WSL only: it needs OpenSSL libssl. On Windows the student runs it in WSL
# (see demo.ps1).
if(NOT WIN32)
  cen429_add_demo(tls_client SOURCES tls_client.c MODE secure
               LIBS ssl crypto)

  # --- Tests ----------------------------------------------------------------------------------
  # Unit: hex_decode()/spki_digest() against a checked-in real certificate fixture (no sockets).
  cen429_add_demo(test_tls_client SOURCES tests/test_tls_client.c MODE secure
               LIBS ssl crypto)
  cen429_test(NAME week-03/06-tls-pinning/unit COMMAND test_tls_client
              PASS_REGEX "0 failures")

  # End-to-end: a shell script starts two local TLS servers with fresh certificates and runs the
  # real tls_client binary through all five demo.sh scenarios (see tests/e2e_tls.sh).
  find_program(CEN429_SH_TOOL sh)
  if(CEN429_SH_TOOL)
    cen429_test(NAME week-03/06-tls-pinning/scenarios-e2e
                COMMAND ${CEN429_SH_TOOL} tests/e2e_tls.sh
                PASS_REGEX "E2E_TLS_ALL_OK")
  endif()
endif()
