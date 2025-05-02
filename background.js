// 拡張機能のインストール/更新時に実行
chrome.runtime.onInstalled.addListener(function(details) {
  // デフォルトでは拡張機能を有効にする
  chrome.storage.local.set({enabled: true}, function() {
    console.log('[Zen2Han] 拡張機能がインストールされ、有効化されました');
  });
});

// アイコンクリック時のアクション（ポップアップが開く）
chrome.action.onClicked.addListener(function(tab) {
  // ポップアップが設定されている場合は自動的に開くため、
  // このハンドラーは基本的に実行されない
});

// 他のコンポーネント（ポップアップなど）からのメッセージを受信
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getState') {
    // 現在の有効/無効状態を返す
    chrome.storage.local.get('enabled', function(data) {
      sendResponse({enabled: data.enabled !== false});
    });
    return true; // 非同期レスポンスを示す
  }
  else if (request.action === 'setState') {
    // 有効/無効状態を設定
    const isEnabled = request.enabled;
    chrome.storage.local.set({enabled: isEnabled}, function() {
      console.log('[Zen2Han] 拡張機能の状態を変更: ' + (isEnabled ? '有効' : '無効'));
      
      // 現在アクティブなタブに新しい状態を通知
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'toggle',
            enabled: isEnabled
          }, function(response) {
            if (chrome.runtime.lastError) {
              console.log('[Zen2Han] タブへのメッセージ送信エラー:', chrome.runtime.lastError);
            } else {
              console.log('[Zen2Han] タブにトグル状態を通知しました');
            }
          });
        }
      });
      
      sendResponse({status: 'success'});
    });
    return true; // 非同期レスポンスを示す
  }
});