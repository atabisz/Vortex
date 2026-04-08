/**
 * Linux runtime stub for winapi-bindings.
 *
 * Satisfies unconditional require('winapi-bindings') calls in packages
 * (e.g. permissions/index.js) that guard all actual usage behind
 * `if (process.platform === 'win32')`. Nothing here is ever called on Linux.
 */

"use strict";

function unsupported(name) {
  return function () {
    throw new Error(name + " is not supported on Linux");
  };
}

const Access = {
  Grant: function () { return {}; },
  Deny: function () { return {}; },
  Revoke: function () { return {}; },
};

module.exports = {
  Access,
  GetDiskFreeSpaceEx: unsupported("GetDiskFreeSpaceEx"),
  GetVolumePathName: unsupported("GetVolumePathName"),
  GetNativeArch: unsupported("GetNativeArch"),
  SetProcessPreferredUILanguages: function () {},
  ShellExecuteEx: unsupported("ShellExecuteEx"),
  CreateTask: unsupported("CreateTask"),
  RunTask: unsupported("RunTask"),
  StopTask: unsupported("StopTask"),
  DeleteTask: unsupported("DeleteTask"),
  InitiateSystemShutdown: unsupported("InitiateSystemShutdown"),
  AbortSystemShutdown: unsupported("AbortSystemShutdown"),
  CreateAppContainer: unsupported("CreateAppContainer"),
  DeleteAppContainer: unsupported("DeleteAppContainer"),
  GrantAppContainer: unsupported("GrantAppContainer"),
  RunInContainer: unsupported("RunInContainer"),
  CreateProcessWithIntegrity: unsupported("CreateProcessWithIntegrity"),
  AddUserPrivilege: unsupported("AddUserPrivilege"),
  RemoveUserPrivilege: unsupported("RemoveUserPrivilege"),
  GetUserPrivilege: unsupported("GetUserPrivilege"),
  GetFileVersionInfo: unsupported("GetFileVersionInfo"),
  SHGetKnownFolderPath: unsupported("SHGetKnownFolderPath"),
  RegGetValue: function () { return undefined; },
  RegSetKeyValue: function () {},
  RegEnumKeys: function () { return []; },
  RegEnumValues: function () { return []; },
  WithRegOpen: function () {},
  GetProcessList: function () { return []; },
  GetModuleList: function () { return []; },
  GetProcessWindowList: function () { return []; },
  SetForegroundWindow: function () { return false; },
  GetUserSID: function () { return ""; },
  LookupAccountName: function () { return undefined; },
  CheckYourPrivilege: function () { return []; },
  GetTasks: function () { return []; },
  SupportsAppContainer: function () { return false; },
  IsThisWine: function () { return false; },
  WhoLocks: function () { return []; },
  WalkDir: function (_basePath, _progress) {
    var cb = arguments[arguments.length - 1];
    if (typeof cb === "function") cb(null);
  },
  SetFileAttributes: function () {},
  AddFileACE: function () {},
  GetProcessToken: function () { return { isElevated: false }; },
  GetPrivateProfileSection: function () { return ""; },
  GetPrivateProfileSectionNames: function () { return []; },
  GetPrivateProfileString: function (_s, _k, defaultValue) { return defaultValue || ""; },
  WritePrivateProfileString: function () {},
  GetSystemPreferredUILanguages: function () { return []; },
  GetUserPreferredUILanguages: function () { return []; },
  GetProcessPreferredUILanguages: function () { return []; },
};
