/**
 * wstring_stub.cpp — Linux wstring ABI shim for node-loot
 *
 * Background: node-loot's napi_helpers.cpp defines fromNAPI<std::wstring>
 * only under #ifdef _WIN32. On Linux, convertArg<std::wstring> still calls
 * this specialisation, so the symbol is an unresolved extern in node-loot.node.
 *
 * This shared library is injected via LD_PRELOAD before the loot subprocess
 * starts, satisfying the missing symbol before node-loot.node is dlopen'd.
 *
 * Built from source by scripts/postinstall-libloot.cjs during `pnpm install`.
 * The compiled libloot_wstring_stub.so is .gitignored — never check it in.
 *
 * Compile command (handled automatically by postinstall-libloot.cjs):
 *   g++ -std=c++17 -shared -fPIC -o libloot_wstring_stub.so wstring_stub.cpp \
 *     -I<node-addon-api> -I<node-headers>
 */

#include <napi.h>
#include <codecvt>
#include <locale>
#include <string>

// Primary template declaration — matches napi_helpers.h in node-loot.
template <typename T>
T fromNAPI(const Napi::Value& info);

// Linux specialisation: JavaScript string (UTF-8) → std::wstring (UTF-32 on Linux).
// On Windows fromNAPI<std::wstring> is compiled into node-loot.node via
// napi_helpers.cpp; on Linux that #ifdef _WIN32 block is excluded, so we
// supply the symbol here.
template <>
std::wstring fromNAPI<std::wstring>(const Napi::Value& info) {
  const std::string utf8 = info.ToString().Utf8Value();
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
  std::wstring_convert<std::codecvt_utf8<wchar_t>> conv;
  return conv.from_bytes(utf8);
#pragma GCC diagnostic pop
}
