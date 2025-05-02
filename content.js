// 全角英数字と記号を半角に変換する関数
function convertFullWidthToHalfWidth(text) {
  if (!text) return text;
  
  // 全角英字（Ａ-Ｚ、ａ-ｚ）を半角に変換
  text = text.replace(/[\uFF21-\uFF3A\uFF41-\uFF5A]/g, function(match) {
    return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
  });
  
  // 全角数字（０-９）を半角に変換
  text = text.replace(/[\uFF10-\uFF19]/g, function(match) {
    return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
  });
  
  // 全角ASCII記号を半角に変換
  // 全角スペース（U+3000）→ 半角スペース（U+0020）
  text = text.replace(/\u3000/g, ' ');
  
  // その他の全角記号（！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝～）
  text = text.replace(/[\uFF01-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF5E]/g, function(match) {
    return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
  });
  
  return text;
}

// デバッグ用関数
function logDebug(message) {
  console.log('[Zen2Han] ' + message);
}

// ページの全テキストノードを処理する関数
function processTextNodes(node) {
  // nullチェック
  if (!node) return;
  
  try {
    // テキストノードの場合
    if (node.nodeType === Node.TEXT_NODE) {
      const originalText = node.nodeValue;
      if (originalText && originalText.trim() !== '') {
        const convertedText = convertFullWidthToHalfWidth(originalText);
        
        // 変換前と変換後が異なる場合のみ更新
        if (originalText !== convertedText) {
          node.nodeValue = convertedText;
          logDebug('テキスト変換: ' + originalText + ' -> ' + convertedText);
        }
      }
    } 
    // 要素ノードの場合、子ノードを再帰的に処理
    else if (node.nodeType === Node.ELEMENT_NODE) {
      // 特定のタグを処理しない
      const skipTags = ['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'NOSCRIPT'];
      
      if (!skipTags.includes(node.tagName)) {
        // 子ノードを処理
        Array.from(node.childNodes).forEach(child => {
          processTextNodes(child);
        });
      }
    }
  } catch (error) {
    console.error('[Zen2Han] Error:', error);
  }
}

// 初期処理実行関数
function initializeConverter() {
  // まず拡張機能の有効/無効状態を確認
  chrome.storage.local.get('enabled', function(data) {
    // デフォルトは有効（undefined の場合も有効）
    const isEnabled = data.enabled !== false;
    
    if (!isEnabled) {
      logDebug('Zen2Han 拡張機能は現在無効です');
      return; // 無効なら何もしない
    }

    logDebug('Zen2Han 拡張機能が初期化されました (有効)');
    
    // ページ全体を処理
    if (document.body) {
      processTextNodes(document.body);
      logDebug('ページ本文の処理が完了しました');
    } else {
      logDebug('document.body がまだ利用できません');
    }
    
    // DOM変更を監視して新しく追加された要素も処理
    const observer = new MutationObserver(function(mutations) {
      // 拡張機能が有効かどうか再確認
      chrome.storage.local.get('enabled', function(data) {
        const isEnabled = data.enabled !== false;
        
        if (!isEnabled) return; // 無効なら何もしない
        
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(function(node) {
              processTextNodes(node);
            });
          }
        });
      });
    });
    
    // ページ全体の変更を監視
    try {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
      logDebug('MutationObserver が設定されました');
    } catch (error) {
      console.error('[Zen2Han] MutationObserver エラー:', error);
    }
  });
}

// メッセージリスナーを設定（バックグラウンドスクリプトからのメッセージを受け取る）
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'toggle') {
    const isEnabled = request.enabled;
    logDebug('トグルメッセージを受信: ' + (isEnabled ? '有効' : '無効'));
    
    if (isEnabled) {
      // 有効化された場合は現在のページを処理
      initializeConverter();
    }
    // 無効化された場合は特に何もしない（次回の変更時に処理されなくなる）
    
    sendResponse({status: 'success'});
  }
});

// ページ読み込み完了時に実行 - これは早めに実行される
document.addEventListener('DOMContentLoaded', function() {
  logDebug('DOMContentLoaded イベント発生');
  initializeConverter();
});

// window.onload - ページの全リソース（画像等）読み込み後に実行 - 遅い段階で実行
window.addEventListener('load', function() {
  logDebug('Window load イベント発生');
  initializeConverter();
});

// すでにDOMが準備できている場合にも対応
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  logDebug('DOM はすでに準備完了状態です');
  initializeConverter();
}