// ============================================
// VERIDICUS I.A — Supabase Integration v2
// ============================================
const SUPABASE_URL = 'https://hkymmmhuvufuuygmbosn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhreW1tbWh1dnVmdXV5Z21ib3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDA5ODksImV4cCI6MjA4OTg3Njk4OX0.ZJYk84W-C881Mihg1ofThBZHZiYT_vmZV-Zw0wAGXMM';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State
let currentUser = null;
let userFavorites = [];
let pendingCPF = '';

// Card name map
const cardNames = { p1: 'Profilaxia PEP', p2: 'Ficha SINAN', p3: 'Cadeia de Custódia', p4: 'Atendimento Suicídio' };

// ---- CPF Mask ----
function maskCPF(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    return v;
}
function displayCPF(cpf) {
    return `***.***.*${cpf.slice(7, 8)}${cpf.slice(8, 9)}-${cpf.slice(9)}`;
}
function maskPhone(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    return v;
}

// ---- Modal Control ----
function closeModal() {
    const m = document.getElementById('login-modal');
    m.classList.remove('show');
    setTimeout(() => m.classList.add('hidden'), 400);
}
function showModal() {
    const m = document.getElementById('login-modal');
    document.getElementById('modal-step-cpf').classList.remove('hidden');
    document.getElementById('modal-step-register').classList.add('hidden');
    m.classList.remove('hidden');
    requestAnimationFrame(() => m.classList.add('show'));
}
function showRegisterStep() {
    document.getElementById('modal-step-cpf').classList.add('hidden');
    document.getElementById('modal-step-register').classList.remove('hidden');
    document.getElementById('register-cpf-display').textContent = `CPF: ${maskCPF(pendingCPF)}`;
}

window.backToStep1 = function () {
    document.getElementById('modal-step-register').classList.add('hidden');
    document.getElementById('modal-step-cpf').classList.remove('hidden');
};

function showUserBar(user) {
    const cpf = user.cpf || sessionStorage.getItem('veridicus_cpf') || '';
    document.getElementById('user-cpf-display').textContent = displayCPF(cpf);
    const nameEl = document.getElementById('user-name-display');
    if (user.nome) {
        nameEl.textContent = user.nome.split(' ')[0];
        nameEl.classList.remove('hidden');
    }
    // Show dashboard link only for admins
    const dashLink = document.getElementById('dashboard-link');
    if (dashLink) {
        if (user.is_admin) dashLink.classList.remove('hidden');
        else dashLink.classList.add('hidden');
    }
    document.getElementById('user-bar').classList.remove('hidden');
    document.getElementById('login-bar').classList.add('hidden');
}

window.showLoginModal = function () {
    showModal();
}

// ---- Login (Step 1: CPF check) ----
window.doLogin = async function () {
    const input = document.getElementById('cpf-input');
    const raw = input.value.replace(/\D/g, '');
    const errEl = document.getElementById('cpf-error');
    if (raw.length !== 11) {
        input.classList.add('error');
        errEl.classList.remove('hidden');
        setTimeout(() => { input.classList.remove('error'); }, 500);
        return;
    }
    errEl.classList.add('hidden');
    // Check if user exists
    let { data: existing } = await sb.from('users').select('*').eq('cpf', raw).maybeSingle();
    if (existing) {
        // Existing user — login directly
        currentUser = existing;
        sessionStorage.setItem('veridicus_uid', existing.id);
        sessionStorage.setItem('veridicus_cpf', raw);
        closeModal();
        showUserBar(existing);
        await loadUserData();
        window.showToast(`Bem-vindo(a), ${existing.nome ? existing.nome.split(' ')[0] : 'usuário'}!`);
    } else {
        // New user — show registration form
        pendingCPF = raw;
        showRegisterStep();
    }
};

// ---- Register (Step 2: Full form) ----
window.doRegister = async function () {
    const nome = document.getElementById('reg-nome').value.trim();
    const telefone = document.getElementById('reg-telefone').value.replace(/\D/g, '');
    const email = document.getElementById('reg-email').value.trim();
    const profissao = document.getElementById('reg-profissao').value.trim();
    const errEl = document.getElementById('reg-error');

    if (!nome || !profissao) {
        errEl.classList.remove('hidden');
        return;
    }
    errEl.classList.add('hidden');

    const { data: newUser, error } = await sb.from('users').insert({
        cpf: pendingCPF,
        nome: nome,
        telefone: telefone,
        email: email,
        profissao: profissao
    }).select().single();

    if (error) {
        window.showToast('Erro ao cadastrar. Tente novamente.');
        console.error(error);
        return;
    }

    currentUser = newUser;
    sessionStorage.setItem('veridicus_uid', newUser.id);
    sessionStorage.setItem('veridicus_cpf', pendingCPF);
    closeModal();
    showUserBar(newUser);
    await loadUserData();
    window.showToast(`Cadastro realizado! Bem-vindo(a), ${nome.split(' ')[0]}!`);
};

window.doLogout = function () {
    currentUser = null;
    userFavorites = [];
    sessionStorage.removeItem('veridicus_uid');
    sessionStorage.removeItem('veridicus_cpf');
    document.getElementById('user-bar').classList.add('hidden');
    document.getElementById('login-bar').classList.remove('hidden');
    resetUI();
    window.showToast('Sessão encerrada.');
    showModal(); // Força o usuário a logar novamente ou ver a tela bloqueada
};

// ---- Load User Data from Supabase ----
async function loadUserData() {
    if (!currentUser) return;
    const uid = currentUser.id;
    const [favsRes] = await Promise.all([
        sb.from('favorites').select('card_id').eq('user_id', uid)
    ]);
    userFavorites = (favsRes.data || []).map(r => r.card_id);
    updateAllUI();
}

async function loadGlobalLikes() {
    const { data } = await sb.from('likes').select('card_id');
    const counts = {};
    (data || []).forEach(r => { counts[r.card_id] = (counts[r.card_id] || 0) + 1; });
    Object.keys(cardNames).forEach(id => {
        const el = document.getElementById(`likes-${id}`);
        if (el) el.textContent = counts[id] || 0;
    });
}

function updateAllUI() {
    Object.keys(cardNames).forEach(id => {
        const toggle = document.getElementById(`fav-toggle-${id}`);
        if (toggle) {
            if (userFavorites.includes(id)) toggle.classList.replace('inactive', 'active');
            else toggle.classList.replace('active', 'inactive');
        }
    });
}

function resetUI() {
    Object.keys(cardNames).forEach(id => {
        const toggle = document.getElementById(`fav-toggle-${id}`);
        if (toggle) toggle.classList.replace('active', 'inactive');
    });
}

// ---- Like (Vote) ----
window.handleVote = async function (e, id) {
    e.stopPropagation();
    if (!currentUser) { showModal(); return; }
    const uid = currentUser.id;
    const svg = e.currentTarget.querySelector('svg');
    await sb.from('likes').insert({ user_id: uid, card_id: id });
    svg.classList.add('heart-active');
    setTimeout(() => svg.classList.remove('heart-active'), 400);
    window.showToast('Relevância Registrada!');
    await loadGlobalLikes();
};

// ---- Favorite ----
window.handleFav = async function (e, id) {
    e.stopPropagation();
    if (!currentUser) { showModal(); return; }
    const uid = currentUser.id;
    const toggle = document.getElementById(`fav-toggle-${id}`);
    if (userFavorites.includes(id)) {
        await sb.from('favorites').delete().eq('user_id', uid).eq('card_id', id);
        userFavorites = userFavorites.filter(x => x !== id);
        toggle.classList.replace('active', 'inactive');
        window.showToast('Removido dos favoritos.');
    } else {
        await sb.from('favorites').insert({ user_id: uid, card_id: id });
        userFavorites.push(id);
        toggle.classList.replace('inactive', 'active');
        window.showToast('Adicionado aos favoritos!');
    }
};

// ---- Card Flip + Visit Tracking ----
window.handleCardClick = async function (card) {
    card.classList.toggle('flipped');
    if (card.classList.contains('flipped')) {
        const cardEl = card.closest('.protocol-card');
        const cardId = cardEl ? cardEl.dataset.id : null;
        if (cardId) {
            const payload = { card_id: cardId };
            if (currentUser) payload.user_id = currentUser.id;
            sb.from('visits').insert(payload).then(() => { });
        }
    }
};

// ---- Document Click Tracking ----
function trackDocClick(e) {
    const link = e.currentTarget;
    const cardEl = link.closest('.protocol-card');
    const cardId = cardEl ? cardEl.dataset.id : 'unknown';
    const docName = link.textContent.trim();
    const docUrl = link.href;
    const payload = { card_id: cardId, document_name: docName, document_url: docUrl };
    if (currentUser) payload.user_id = currentUser.id;
    sb.from('document_clicks').insert(payload).then(() => { });
}

// ---- Filter Cards ----
window.filterCards = function (criteria, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
        b.classList.add('text-slate-500', 'bg-white', 'border-slate-200');
    });
    btn.classList.add('active');
    btn.classList.remove('text-slate-500', 'bg-white', 'border-slate-200');
    const cards = Array.from(document.querySelectorAll('.protocol-card'));
    cards.forEach(card => {
        const id = card.dataset.id;
        const cat = card.dataset.category;
        const isFav = userFavorites.includes(id);
        card.style.display = "none";
        if (criteria === 'all' || criteria === 'recent') card.style.display = "block";
        else if (criteria === 'favs' && isFav) card.style.display = "block";
        else if (criteria === cat) card.style.display = "block";
    });
};

// ---- Testimonials ----
const testimonialPool = [
    { text: "Decisões seguras no plantão são cruciais. Os protocolos do Veridicus são impecáveis.", name: "Dra. Ana Silva", role: "Médica Emergencista", initial: "AS" },
    { text: "Reduzimos as falhas na notificação compulsória com o guia técnico do portal.", name: "Enf. Carlos Medeiros", role: "Gestor Hospitalar", initial: "CM" },
    { text: "Rigor pericial que protege o profissional na ponta. Recomendo fortemente.", name: "Dra. Paula Rocha", role: "Perita Legista", initial: "PR" },
    { text: "Segurança jurídica real para situações críticas de acolhimento à vítima.", name: "Dr. Fábio Souza", role: "Diretor Clínico", initial: "FS" },
    { text: "Material técnico direto ao ponto. Essencial para o plantão de urgência.", name: "Enf. Marcos Lima", role: "Coord. de Emergência", initial: "ML" }
];
window.renderRandomTestimonials = function () {
    const grid = document.getElementById('testimonials-grid');
    if (!grid) return;
    grid.innerHTML = "";
    const shuffled = [...testimonialPool].sort(() => 0.5 - Math.random());
    shuffled.slice(0, 3).forEach((t, i) => {
        const card = document.createElement('div');
        card.className = 'testimonial-card opacity-0 translate-y-4';
        card.innerHTML = `<p class="text-slate-600 italic mb-8 font-medium">"${t.text}"</p><div class="flex items-center gap-4"><div class="w-12 h-12 bg-blue-900 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">${t.initial}</div><div><h4 class="font-bold text-slate-900 leading-none mb-1">${t.name}</h4><p class="text-[10px] text-slate-400 uppercase font-black tracking-tighter">${t.role}</p></div></div>`;
        grid.appendChild(card);
        setTimeout(() => card.classList.remove('opacity-0', 'translate-y-4'), i * 100);
    });
};

// ---- WhatsApp ----
window.sendWhatsAppSuggestion = function () {
    const text = document.getElementById('suggestion-text').value;
    if (!text) return window.showToast("Escreva a sua sugestão primeiro.");
    const phoneNumber = "5531999572799";
    const message = encodeURIComponent(`Olá Equipe Técnica Veridicus!\n\nTenho uma sugestão de tema/protocolo para a Rede:\n\n"${text}"`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    document.getElementById('suggestion-text').value = "";
    window.showToast("Abrindo o WhatsApp...");
};

// ---- Toast ----
window.showToast = function (m) {
    const t = document.getElementById("toast");
    t.innerText = m; t.classList.remove("hidden");
    setTimeout(() => t.classList.add("hidden"), 3000);
};

// ---- Init ----
async function initApp() {
    // CPF input mask
    const cpfInput = document.getElementById('cpf-input');
    if (cpfInput) {
        cpfInput.addEventListener('input', function () { this.value = maskCPF(this.value); });
        cpfInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') window.doLogin(); });
    }

    // Phone input mask
    const phoneInput = document.getElementById('reg-telefone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function () { this.value = maskPhone(this.value); });
    }

    // Attach doc click tracking to all flip-card-back links
    document.querySelectorAll('.flip-card-back a[href]').forEach(link => {
        link.addEventListener('click', trackDocClick);
    });

    // Check session
    const savedId = sessionStorage.getItem('veridicus_uid');
    const savedCpf = sessionStorage.getItem('veridicus_cpf');
    if (savedId && savedCpf) {
        const { data } = await sb.from('users').select('*').eq('id', savedId).maybeSingle();
        if (data) {
            currentUser = data;
            showUserBar(data);
            await loadUserData();
        } else {
            showModal();
            document.getElementById('login-bar').classList.remove('hidden');
        }
    } else {
        showModal();
        document.getElementById('login-bar').classList.remove('hidden');
    }

    await loadGlobalLikes();
    window.renderRandomTestimonials();
}

document.addEventListener('DOMContentLoaded', initApp);
