import { execSync } from './exec';
import { getLogger } from './get-logger';

/** 关闭 window 的快速编辑模式 */
export function setQuickEdit(enable = false) {
  if (process.platform !== 'win32') return false;

  try {
    let cmd = 'reg query HKEY_CURRENT_USER\\Console /v QuickEdit';
    const quickEditSetting = execSync(cmd).stdout;
    const isEnabled = String(quickEditSetting).trim().endsWith('1');
    // console.log(String(quickEditSetting).trim(), isEnabled === enable);
    if (isEnabled === enable) return true;

    cmd = `reg add HKEY_CURRENT_USER\\Console /v QuickEdit /t REG_DWORD /d 0000000${enable ? '1' : '0'} /f`;
    execSync(cmd);
    return true;
  } catch (error) {
    getLogger().error('[setQuickEdit][error]\n', error);
    return false;
  }
}
