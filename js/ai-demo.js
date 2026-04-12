/* ===== AI Real-Time Demo ===== */

(function() {
    'use strict';

    const chat = document.getElementById('aiChat');
    const suggestions = document.getElementById('aiSuggestions');
    if (!chat || !suggestions) return;

    // AI analysis database
    const analyses = {
        'Никогда не смогу побороть свою тревогу': {
            distortions: ['Сверхобобщение', 'Катастрофизация', 'Гадание'],
            analysis: 'Слово "никогда" — классический пример сверхобобщения. Этот тип мышления берёт одну ситуацию и проецирует её на всю жизнь. Также присутствует катастрофизация — убеждённость в наихудшем исходе.',
            alternative: 'Более реалистичная мысль: "Сейчас мне тяжело с тревогой, но я уже делаю шаги к её преодолению. Многие люди успешно справились с тревогой — и я тоже способен на это."',
            impact: 85
        },
        'Если я почувствую панику, случится что-то ужасное': {
            distortions: ['Катастрофизация', 'Эмоциональное рассуждение', 'Предсказание будущего'],
            analysis: 'Это классическая когнитивная ошибка — приравнивание физических ощущений к реальной опасности. Паника неприятна, но безопасна. Тело запускает реакцию "бей или беги" без реальной угрозы.',
            alternative: 'Более реалистичная мысль: "Паника — это просто избыточная реакция тела. Она неприятна, но не опасна. Она пройдёт сама за несколько минут, как всегда."',
            impact: 92
        },
        'Я слабый, раз не могу контролировать свои эмоции': {
            distortions: ['Навешивание ярлыков', 'Чёрно-белое мышление', 'Долженствование'],
            analysis: 'Навешивание ярлыка "слабый" на себя — это подмена описания поведения определением личности. Эмоции — не показатель слабости, а нормальная реакция нервной системы. Требование "я должен контролировать" создаёт замкнутый круг напряжения.',
            alternative: 'Более реалистичная мысль: "Испытывать сильные эмоции — это нормально для человека. Я могу научиться лучше с ними справляться, и это признак мужества, а не слабости."',
            impact: 78
        }
    };

    // Click handler for suggestions
    suggestions.addEventListener('click', (e) => {
        const btn = e.target.closest('.ai-suggestion');
        if (!btn || btn.disabled) return;

        const thought = btn.getAttribute('data-thought');
        if (!thought || !analyses[thought]) return;

        // Disable all suggestions
        suggestions.querySelectorAll('.ai-suggestion').forEach(b => b.disabled = true);

        // Add user message
        addMessage('user', thought);

        // Show typing
        const typingEl = addTyping();

        // Simulate AI "thinking" with progressive output
        setTimeout(() => {
            typingEl.remove();
            const data = analyses[thought];
            showAIAnalysis(data);
        }, 1800);
    });

    function addMessage(type, text) {
        const msg = document.createElement('div');
        msg.className = `ai-message ai-message-${type}`;

        const avatar = document.createElement('div');
        avatar.className = 'ai-avatar';

        if (type === 'user') {
            avatar.textContent = 'T';
        } else {
            avatar.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M6 10v1a6 6 0 0 0 12 0v-1"/><path d="M12 18v4"/><path d="M8 22h8"/></svg>';
        }

        const bubble = document.createElement('div');
        bubble.className = 'ai-bubble';
        bubble.innerHTML = `<p>${text}</p>`;

        msg.appendChild(avatar);
        msg.appendChild(bubble);
        chat.appendChild(msg);
        chat.scrollTop = chat.scrollHeight;

        return msg;
    }

    function addTyping() {
        const msg = document.createElement('div');
        msg.className = 'ai-message ai-message-system';

        const avatar = document.createElement('div');
        avatar.className = 'ai-avatar';
        avatar.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M6 10v1a6 6 0 0 0 12 0v-1"/><path d="M12 18v4"/><path d="M8 22h8"/></svg>';

        const bubble = document.createElement('div');
        bubble.className = 'ai-bubble';
        bubble.innerHTML = '<div class="ai-typing"><span></span><span></span><span></span></div>';

        msg.appendChild(avatar);
        msg.appendChild(bubble);
        chat.appendChild(msg);
        chat.scrollTop = chat.scrollHeight;

        return msg;
    }

    function showAIAnalysis(data) {
        // Step 1: Show distortion tags
        const msg1 = addMessage('system', '');
        const bubble1 = msg1.querySelector('.ai-bubble');
        bubble1.innerHTML = '<p><strong>Обнаруженные когнитивные искажения:</strong></p>';

        let delay = 0;
        data.distortions.forEach((d, i) => {
            setTimeout(() => {
                const tag = document.createElement('span');
                tag.className = 'distortion-tag';
                tag.textContent = d;
                tag.style.opacity = '0';
                tag.style.transform = 'translateY(8px)';
                bubble1.appendChild(tag);
                // Animate in
                requestAnimationFrame(() => {
                    tag.style.transition = 'all 0.3s ease';
                    tag.style.opacity = '1';
                    tag.style.transform = 'translateY(0)';
                });
                chat.scrollTop = chat.scrollHeight;
            }, delay);
            delay += 400;
        });

        // Step 2: Show analysis with typewriter effect
        setTimeout(() => {
            const msg2 = addMessage('system', '');
            const bubble2 = msg2.querySelector('.ai-bubble');
            bubble2.innerHTML = '<p><strong>Анализ:</strong></p>';
            typeWriter(bubble2, data.analysis, 18, () => {
                chat.scrollTop = chat.scrollHeight;

                // Step 3: Impact meter
                setTimeout(() => {
                    const msg3 = addMessage('system', '');
                    const bubble3 = msg3.querySelector('.ai-bubble');
                    bubble3.innerHTML = `
                        <p><strong>Уровень эмоционального воздействия:</strong></p>
                        <div style="margin-top:10px;background:rgba(108,92,231,0.1);border-radius:20px;height:8px;overflow:hidden">
                            <div class="impact-bar" style="width:0%;height:100%;background:linear-gradient(90deg,#6C5CE7,#A29BFE);border-radius:20px;transition:width 1.2s cubic-bezier(0.16,1,0.3,1)"></div>
                        </div>
                        <p style="margin-top:6px;font-size:12px;color:#64648C">${data.impact}% — высокое эмоциональное воздействие</p>
                    `;

                    setTimeout(() => {
                        const bar = bubble3.querySelector('.impact-bar');
                        if (bar) bar.style.width = data.impact + '%';
                    }, 100);

                    chat.scrollTop = chat.scrollHeight;

                    // Step 4: Alternative thought
                    setTimeout(() => {
                        const msg4 = addMessage('system', '');
                        const bubble4 = msg4.querySelector('.ai-bubble');
                        bubble4.innerHTML = '<p><strong>Альтернативная мысль (ТКП):</strong></p>';
                        const alt = document.createElement('span');
                        alt.className = 'alternative';
                        bubble4.appendChild(alt);
                        typeWriter(alt, data.alternative, 15, () => {
                            chat.scrollTop = chat.scrollHeight;

                            // Re-enable remaining suggestions
                            setTimeout(() => {
                                suggestions.querySelectorAll('.ai-suggestion').forEach(b => {
                                    if (b.getAttribute('data-thought') !== Object.keys(analyses).find(k => analyses[k] === data)) {
                                        b.disabled = false;
                                    }
                                });
                            }, 500);
                        });
                    }, 800);
                }, 600);
            });
        }, delay + 600);
    }

    function typeWriter(element, text, speed, callback) {
        const p = document.createElement('p');
        p.style.marginTop = '8px';
        element.appendChild(p);

        let i = 0;
        function type() {
            if (i < text.length) {
                p.textContent += text.charAt(i);
                i++;
                chat.scrollTop = chat.scrollHeight;
                setTimeout(type, speed + Math.random() * 10);
            } else {
                if (callback) callback();
            }
        }
        type();
    }
})();
