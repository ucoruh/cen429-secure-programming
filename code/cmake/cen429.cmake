# CEN429 — demolar için ortak CMake yardımcıları
#
# Her demo ikili dosyası kaynak klasörünün altındaki bin/<platform>/ klasörüne yazılır
# (platform: windows ya da linux). Böylece demo.ps1 / demo.sh betikleri ikili dosyaları
# derleyiciden ve Visual Studio yapılandırmasından bağımsız olarak aynı yerde bulur.

if(WIN32)
  set(CEN429_PLATFORM windows)
else()
  set(CEN429_PLATFORM linux)
endif()

# --- Araç zinciri yetenekleri ---------------------------------------------
# ASan ve ELF sertleştirme (PIE/RELRO) yalnız belirli araç zincirlerinde çalışır:
#   * MSVC                 -> ASan var (/fsanitize=address), ELF sertleştirme yok (Windows PE)
#   * Linux/macOS GCC/Clang-> ASan var, ELF sertleştirme var
#   * Windows MinGW/Clang  -> ikisi de güvenilir değil (MinGW'de libasan yok; clang MSVC
#                             hedefine geçip -fPIE/-Wl,-z,relro'yu reddeder)
# Desteklenmeyen kurulumda bu demolar SADE modda derlenir (hata vermez); tam sürüm için
# Visual Studio (MSVC) ya da WSL/Linux GCC kullanın.
if(MSVC)
  set(CEN429_ASAN_VAR ON)
  set(CEN429_ELF_SERT OFF)
elseif(NOT WIN32)
  set(CEN429_ASAN_VAR ON)
  set(CEN429_ELF_SERT ON)
else()
  set(CEN429_ASAN_VAR OFF)
  set(CEN429_ELF_SERT OFF)
  message(STATUS "CEN429: Windows'ta MSVC bulunamadi (MinGW/clang). ASan, ELF sertlestirme "
                 "ve libFuzzer demolari SADE modda derlenir. Tam surum: Visual Studio (MSVC) "
                 "ya da WSL/Linux GCC.")
endif()

# Optimizasyon ve güvenlik bayraklarını her hedef kendisi seçer; derleyicinin yapılandırma
# (Debug/Release) varsayılanları demoların davranışını değiştirmesin diye sadeleştirilir.
foreach(_dil C CXX)
  foreach(_yap DEBUG RELEASE RELWITHDEBINFO MINSIZEREL)
    if(MSVC)
      set(CMAKE_${_dil}_FLAGS_${_yap} "/Zi")
    else()
      set(CMAKE_${_dil}_FLAGS_${_yap} "-g")
    endif()
  endforeach()
endforeach()
if(MSVC)
  foreach(_yap DEBUG RELEASE RELWITHDEBINFO MINSIZEREL)
    set(CMAKE_EXE_LINKER_FLAGS_${_yap} "/DEBUG")
  endforeach()
  # Hata ayıklama çalışma kütüphanesi (/MDd) iletişim kutuları açar; demolar her yapılandırmada
  # sürüm kütüphanesiyle (/MD) bağlanır. ASan da bunu gerektirir.
  set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreadedDLL")
  # Bilgisayarda "vcpkg integrate install" yapılmışsa Visual Studio her projeye vcpkg kütüphanelerini ekler.
  # Demolar dış kütüphane kullanmaz; herkesin makinesinde aynı derlensin diye bu projelerde kapatılır.
  set(CMAKE_VS_GLOBALS "VcpkgEnabled=false")
endif()

# cen429_hafta_demolari()
#
# Hafta klasörünün CMakeLists.txt dosyası yalnız bunu çağırır: içinde CMakeLists.txt bulunan her alt
# klasör (demo) sırayla eklenir. Yalnız bazı demoları derlemek için: -DCEN429_DEMO_DESENI="^0[7-9]-"
function(cen429_hafta_demolari)
  file(GLOB _alt RELATIVE "${CMAKE_CURRENT_SOURCE_DIR}" "${CMAKE_CURRENT_SOURCE_DIR}/*")
  list(SORT _alt)
  foreach(_demo IN LISTS _alt)
    if(IS_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/${_demo}"
       AND EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/${_demo}/CMakeLists.txt")
      if(NOT CEN429_DEMO_DESENI OR _demo MATCHES "${CEN429_DEMO_DESENI}")
        add_subdirectory(${_demo})
      endif()
    endif()
  endforeach()
endfunction()

# cen429_ornek(<hedef> KAYNAK <dosya>... [MOD <mod>] [TANIM <makro>...] [KUTUPHANE <lib>...]
#              [SECENEK <derleyici seçeneği>...])
#
# MOD:
#   korumasiz  optimizasyon yok, ek koruma yok        (GCC: -O0      MSVC: /Od)
#   optimize   sürüm derlemesi gibi optimizasyonlu    (GCC: -O2      MSVC: /O2)
#   asan       AddressSanitizer                       (GCC: -O1 -fsanitize=address  MSVC: /fsanitize=address)
#   denetimli  kütüphane çağrılarında boyut denetimi  (GCC: -O2 -D_FORTIFY_SOURCE=2  MSVC: /O2 + _s işlevleri)
#   guvenli    düzeltilmiş kod, uyarılar açık, optimizasyonlu
function(cen429_ornek hedef)
  cmake_parse_arguments(A "" "MOD" "KAYNAK;TANIM;KUTUPHANE;SECENEK" ${ARGN})
  if(NOT A_MOD)
    set(A_MOD korumasiz)
  endif()
  add_executable(${hedef} ${A_KAYNAK})
  target_include_directories(${hedef} PRIVATE "${PROJECT_SOURCE_DIR}/common")
  target_compile_definitions(${hedef} PRIVATE ${A_TANIM})
  if(A_SECENEK)
    target_compile_options(${hedef} PRIVATE ${A_SECENEK})
  endif()
  if(A_KUTUPHANE)
    target_link_libraries(${hedef} PRIVATE ${A_KUTUPHANE})
  endif()

  if(MSVC)
    target_compile_definitions(${hedef} PRIVATE _CRT_SECURE_NO_WARNINGS)
    target_compile_options(${hedef} PRIVATE /W4 /utf-8)
    if(A_MOD STREQUAL "korumasiz")
      target_compile_options(${hedef} PRIVATE /Od)
    elseif(A_MOD STREQUAL "asan")
      target_compile_options(${hedef} PRIVATE /Od /fsanitize=address)
      target_link_options(${hedef} PRIVATE /INCREMENTAL:NO)
      # ASan çalışma kütüphanesini ikili dosyanın yanına kopyala (Visual Studio dışından da çalışsın)
      get_filename_component(_cl_dizin "${CMAKE_C_COMPILER}" DIRECTORY)
      set(_asan_dll "${_cl_dizin}/clang_rt.asan_dynamic-x86_64.dll")
      if(EXISTS "${_asan_dll}")
        add_custom_command(TARGET ${hedef} POST_BUILD
          COMMAND ${CMAKE_COMMAND} -E copy_if_different "${_asan_dll}" "$<TARGET_FILE_DIR:${hedef}>")
      endif()
    elseif(A_MOD STREQUAL "denetimli")
      target_compile_options(${hedef} PRIVATE /O2)
      target_compile_definitions(${hedef} PRIVATE KUTUPHANE_DENETIMI)
    else()  # optimize, guvenli
      target_compile_options(${hedef} PRIVATE /O2)
    endif()
  else()
    target_compile_options(${hedef} PRIVATE -Wall -Wextra)
    if(A_MOD STREQUAL "korumasiz")
      target_compile_options(${hedef} PRIVATE -O0)
    elseif(A_MOD STREQUAL "asan")
      if(CEN429_ASAN_VAR)
        # Ubuntu GCC'si FORTIFY'ı kendiliğinden açar; yalnız ASan'ı görmek için kapatıyoruz.
        target_compile_options(${hedef} PRIVATE -O1 -U_FORTIFY_SOURCE -fsanitize=address -fno-omit-frame-pointer)
        target_link_options(${hedef} PRIVATE -fsanitize=address)
      else()
        # ASan desteklenmiyor (ör. Windows MinGW): sade -O1 ile derle, demo yine çalışır.
        target_compile_options(${hedef} PRIVATE -O1)
      endif()
    elseif(A_MOD STREQUAL "denetimli")
      target_compile_options(${hedef} PRIVATE -O2 -U_FORTIFY_SOURCE -D_FORTIFY_SOURCE=2)
    else()  # optimize, guvenli
      target_compile_options(${hedef} PRIVATE -O2)
    endif()
  endif()

  # Çıktı: <demo klasörü>/bin/<platform>/  ($<0:> Visual Studio'nun Debug/Release alt klasörünü engeller)
  # Visual Studio'da F5 ile çalıştırınca çalışma klasörü demo klasörü olur (parola.txt gibi dosyalar bulunur).
  set_target_properties(${hedef} PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/bin/${CEN429_PLATFORM}$<0:>"
    VS_DEBUGGER_WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
    FOLDER "${CEN429_KLASOR}")
endfunction()
