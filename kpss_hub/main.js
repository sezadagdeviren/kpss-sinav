let currentCategory = 'Türkçe';
let turkishQuestions = [];
let gkQuestions = [];
let mathQuestions = [];

const categoryMap = {
    'Türkçe': 'count-tr',
    'Tarih': 'count-hist',
    'Cografya': 'count-geo',
    'Matematik': 'count-mat',
    'Anayasa': 'count-vat'
};

async function loadData() {
    try {
        const trResponse = await fetch('Turkce_2006_2025_Full_Dataset.json');
        turkishQuestions = await trResponse.json();

        const gkResponse = await fetch('Genel_Kultur_2006_2025_Full_Dataset.json');
        gkQuestions = await gkResponse.json();

        const matResponse = await fetch('Matematik_2006_2025_Full_Dataset.json');
        mathQuestions = await matResponse.json();

        updateCounts();
        renderTopics(currentCategory);
        console.log('Datasets loaded successfully');
    } catch (error) {
        console.error('Error loading datasets:', error);
        document.getElementById('topic-container').innerHTML = `<div class="error-msg">Veriler yüklenemedi: ${error.message}</div>`;
    }
}

function updateCounts() {
    document.getElementById('count-tr').textContent = turkishQuestions.length;
    
    document.getElementById('count-hist').textContent = gkQuestions.filter(q => q.kategori === 'Tarih').length;
    document.getElementById('count-geo').textContent = gkQuestions.filter(q => q.kategori === 'Cografya').length;
    document.getElementById('count-mat').textContent = mathQuestions.length;
    document.getElementById('count-vat').textContent = gkQuestions.filter(q => q.kategori === 'Anayasa' || q.kategori === 'Vatandaslik').length;
}

function renderTopics(category) {
    const topicContainer = document.getElementById('topic-container');
    
    let questions = [];
    if (category === 'Türkçe') questions = turkishQuestions;
    else if (category === 'Matematik') questions = mathQuestions;
    else questions = gkQuestions.filter(q => q.kategori === category || (category === 'Anayasa' && q.kategori === 'Vatandaslik'));
    
    // Group by topic
    const topicCounts = {};
    questions.forEach(q => {
        const topic = q.konu || 'Genel Konu';
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    topicContainer.innerHTML = '';
    
    Object.entries(topicCounts).sort((a,b) => b[1] - a[1]).forEach(([topic, count]) => {
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.innerHTML = `
            <h3>${topic}</h3>
            <div class="info">
                <span class="q-count">${count} Soru</span>
                <span class="btn-show-answer" style="padding: 4px 12px; font-size: 0.8rem; width: auto; margin:0">İncele →</span>
            </div>
        `;
        card.onclick = () => renderQuestions(topic, category);
        topicContainer.appendChild(card);
    });

    // Reset View
    document.getElementById('question-view').style.display = 'none';
    topicContainer.style.display = 'grid';
    document.getElementById('category-title').textContent = `${category} Soruları`;
}

function renderQuestions(topic, category) {
    const listContainer = document.getElementById('questions-list');
    
    let questions = [];
    if (category === 'Türkçe') {
        questions = turkishQuestions.filter(q => (q.konu || 'Genel Konu') === topic);
    } else if (category === 'Matematik') {
        questions = mathQuestions.filter(q => (q.konu || 'Genel Konu') === topic);
    } else {
        questions = gkQuestions.filter(q => (q.konu || 'Genel Konu') === topic && (q.kategori === category || (category === 'Anayasa' && q.kategori === 'Vatandaslik')));
    }

    listContainer.innerHTML = '';
    document.getElementById('topic-container').style.display = 'none';
    document.getElementById('question-view').style.display = 'flex';
    document.getElementById('category-title').textContent = `${topic}`;
    document.getElementById('category-subtitle').textContent = `${category} dersine ait ${questions.length} soru listeleniyor.`;

    questions.forEach((q, idx) => {
        const qCard = document.createElement('div');
        qCard.className = 'question-card';
        // USE IMAGE INSTEAD OF TEXT
        qCard.innerHTML = `
            <div class="q-header">
                <div class="q-meta">
                    <span class="year-tag">${q.yil} KPSS</span>
                    <span>Soru No: ${q.soru_no}</span>
                </div>
                <div class="diff-tag">${q.zorluk_seviyesi || 'Orta'}</div>
            </div>
            <div class="q-image-container">
                <img src="${q.soru_resmi}" alt="Soru ${q.soru_no}" class="q-image">
            </div>
            <div class="answer-section">
                <button class="btn-show-answer" onclick="toggleAnswer(this)">Doğru Cevabı Göster</button>
                <div class="answer-box">
                    <span class="correct-answer-text">Doğru Cevap: ${q.dogru_cevap}</span>
                    <p class="explanation">${q.cozum || 'Bu soru için detaylı çözüm henüz eklenmemiş.'}</p>
                </div>
            </div>
        `;
        listContainer.appendChild(qCard);
    });
}

function toggleAnswer(btn) {
    const box = btn.nextElementSibling;
    box.classList.toggle('visible');
    btn.textContent = box.classList.contains('visible') ? 'Cevabı Gizle' : 'Doğru Cevabı Göster';
}

// Event Listeners
document.getElementById('category-nav').addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        navItem.classList.add('active');
        currentCategory = navItem.dataset.category;
        renderTopics(currentCategory);
    }
});

document.getElementById('btn-back').onclick = () => {
    document.getElementById('question-view').style.display = 'none';
    document.getElementById('topic-container').style.display = 'grid';
    document.getElementById('category-title').textContent = `${currentCategory} Soruları`;
    document.getElementById('category-subtitle').textContent = `Konu başlıklarına göre ayrılmış sorular ve çözümleri.`;
};

// Start
loadData();
