// content/content-script.js
console.log('[Chrome Agent] Content Script Loaded on:', window.location.href);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Content Script] Message received:', {
        type: message.type,
        command: message.command?.command
    });

    if (message.type === 'EXECUTE_COMMAND') {
        const payload = message.command;
        const command = payload?.command;
        const params = payload?.params;

        console.log('[Content Script] Executing command:', {
            command,
            params: JSON.stringify(params)
        });

        try {
            let result;

            switch (command) {
                case 'EXTRACT_DOM':
                    console.log('[EXTRACT_DOM] Starting with selector:', params?.selector);
                    result = extractDom(params);
                    console.log('[EXTRACT_DOM] Result:', {
                        count: result.count,
                        hasError: !!result.error
                    });
                    break;

                case 'EXTRACT_FORM':
                    console.log('[EXTRACT_FORM] Starting with selector:', params?.formSelector);
                    result = extractForm(params);
                    console.log('[EXTRACT_FORM] Result:', {
                        fieldCount: result.fieldCount,
                        hasError: !!result.error
                    });
                    break;

                case 'GET_PAGE_INFO':
                    console.log('[GET_PAGE_INFO] Starting...');
                    result = getPageInfo();
                    console.log('[GET_PAGE_INFO] Result:', result);
                    break;

                default:
                    console.error('[Content Script] Unknown command:', command);
                    result = { error: 'UNKNOWN_COMMAND', message: `Unknown command: ${command}` };
            }

            sendResponse(result);

        } catch (error) {
            console.error('[Content Script] Execution error:', error);
            sendResponse({
                error: 'EXECUTION_ERROR',
                message: error.message || 'Unknown error occurred'
            });
        }

    } else if (message.type === 'GET_FORM_COUNT') {
        // Side Panel에서 폼 개수 조회
        const forms = document.querySelectorAll('form');
        console.log('[Content Script] Form count:', forms.length);
        sendResponse({ count: forms.length });

    } else {
        console.warn('[Content Script] Unhandled message type:', message.type);
    }

    return true; // Keep channel open for async response
});

function extractDom(params) {
    const selector = params.selector;
    const extractType = params.extractType || 'all';
    const multiple = params.multiple || false;

    if (!selector) return { error: 'INVALID_SELECTOR' };

    let elements;
    try {
        if (multiple) {
            elements = Array.from(document.querySelectorAll(selector));
        } else {
            const el = document.querySelector(selector);
            elements = el ? [el] : [];
        }
    } catch (e) {
        return { error: 'INVALID_SELECTOR' };
    }

    const extracted = elements.map((el, index) => {
        const data = {
            tagName: el.tagName,
            rect: el.getBoundingClientRect()
        };

        if (extractType === 'html' || extractType === 'all') {
            data.html = el.outerHTML;
        }
        if (extractType === 'text' || extractType === 'all') {
            data.text = el.innerText;
        }
        if (extractType === 'attribute' || extractType === 'all') {
            const attrs = {};
            if (params.attributes) {
                params.attributes.forEach(attr => {
                    attrs[attr] = el.getAttribute(attr);
                });
            } else {
                Array.from(el.attributes).forEach(attr => {
                    attrs[attr.name] = attr.value;
                });
            }
            data.attributes = attrs;
        }
        return data;
    });

    return {
        elements: extracted,
        count: extracted.length,
        selector: selector
    };
}

function extractForm(params) {
    const selector = params.formSelector;
    const form = document.querySelector(selector);

    if (!form) return { error: 'ELEMENT_NOT_FOUND', message: 'Form not found' };

    const fields = Array.from(form.elements).map(el => {
        if (!el.name) return null;
        return {
            name: el.name,
            type: el.type,
            value: el.value,
            id: el.id
        };
    }).filter(x => x);

    return {
        form: {
            action: form.action,
            method: form.method
        },
        fields: fields,
        fieldCount: fields.length
    };
}

function getPageInfo() {
    return {
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname
    };
}
