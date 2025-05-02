// ポップアップが開かれたときに実行
document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusText = document.getElementById('statusText');
  
  // 現在の状態を取得して表示
  chrome.runtime.sendMessage({action: 'getState'}, function(response) {
    if (response && response.enabled !== undefined) {
      toggleSwitch.checked = response.enabled;
      updateStatusText(response.enabled);
    }
  });
  
  // トグルスイッチの状態が変更されたとき
  toggleSwitch.addEventListener('change', function() {
    const isEnabled = toggleSwitch.checked;
    
    // バックグラウンドスクリプトに状態変更を通知
    chrome.runtime.sendMessage(
      {action: 'setState', enabled: isEnabled},
      function(response) {
        if (response && response.status === 'success') {
          updateStatusText(isEnabled);
        }
      }
    );
  });
  
  // ステータステキストを更新する関数
  function updateStatusText(isEnabled) {
    statusText.textContent = '現在: ' + (isEnabled ? '有効' : '無効');
    statusText.style.color = isEnabled ? '#2e7d32' : '#c62828';
  }
});