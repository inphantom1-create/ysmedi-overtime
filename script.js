/* ============================================================
   시간외 근무 신청 시스템 - script.js
   ============================================================ */
const GAS_URL        = 'https://script.google.com/macros/s/AKfycbzjD764qLr-6V1L9v7xVmWJw9DSBHQ3AfWldlGHk6p5lfu84fV2n5SgFFIri-dCHsuymw/exec';
const ADMIN_PASSWORD = '1234';
const WORK_START  = timeToMin('08:30');
const WORK_END    = timeToMin('17:30');
const LUNCH_START = timeToMin('12:00');
const LUNCH_END   = timeToMin('13:00');
const DIN_START   = timeToMin('18:00');
const DIN_END     = timeToMin('18:30');
const DEFAULT_MEMBERS = [
  '하정열','강경민','오근탁','김지필','김민수','김동영','조재선','조웅제',
  '조성훈','오석순','김희원','양지유','배경순','김향란','진종민','박채영',
  '전지민','김기태','김재룡','배성준','임현준','김태양','이정찬','안성준',
  '장우석'
];

/* ============================================================
   유틸리티
   ============================================================ */
function timeToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minToLabel(min) {
  if (min <= 0) return '0시간 0분';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}
function overlap(s1, e1, s2, e2) {
  return Math.max(0, Math.min(e1, e2) - Math.max(s1, s2));
}
function getTodayLabel() {
  const days = ['일','월','화','수','목','금','토'];
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}
function getTodayKST() {
  const d = new Date();
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}
function getNowISO() {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}
function getAttendance() {
  const el = document.querySelector('input[name="attendance"]:checked');
  return el ? el.value : '';
}

/* ============================================================
   토/일/공휴일 여부 확인 (2025~2026 대체공휴일 포함)
   ============================================================ */
function isWeekendOrHolidayJS(dateStr) {
  if (!dateStr) return false;
  const d   = new Date(dateStr);
  const dow = d.getDay(); // 0=일, 6=토
  if (dow === 0 || dow === 6) return true;

  const holidays = [
    // 2025년 공휴일 + 대체공휴일
    '2025-01-01',                          // 신정
    '2025-01-28','2025-01-29','2025-01-30',// 설날 연휴
    '2025-03-01',                          // 삼일절
    '2025-05-01',                          // 노동절
    '2025-05-05','2025-05-06',             // 어린이날 + 대체
    '2025-06-06',                          // 현충일
    '2025-08-15',                          // 광복절
    '2025-10-03',                          // 개천절
    '2025-10-06','2025-10-07','2025-10-08',// 추석 연휴
    '2025-10-09',                          // 한글날
    '2025-12-25',                          // 크리스마스
    // 2026년 공휴일 + 대체공휴일
    '2026-01-01',                          // 신정
    '2026-01-28','2026-01-29','2026-01-30',// 설날 연휴
    '2026-03-01','2026-03-02',             // 삼일절 + 대체
    '2026-05-01',                          // 노동절
    '2026-05-05',                          // 어린이날
    '2026-05-24','2026-05-25',             // 부처님오신날 + 대체
    '2026-06-03',                          // 지방선거일
    '2026-06-06',                          // 현충일
    '2026-07-17',                          // 제헌절
    '2026-08-15','2026-08-17',             // 광복절 + 대체
    '2026-09-24','2026-09-25','2026-09-26',// 추석 연휴
    '2026-10-03','2026-10-05',             // 개천절 + 대체
    '2026-10-09',                          // 한글날
    '2026-12-25',                          // 크리스마스
    // 2027년 공휴일 + 대체공휴일
    '2027-01-01',                          // 신정
    '2027-02-06','2027-02-07','2027-02-08','2027-02-09', // 설날 연휴 + 대체
    '2027-03-01',                          // 삼일절
    '2027-05-01',                          // 노동절(토) - 대체 5/3
    '2027-05-03',                          // 노동절 대체공휴일
    '2027-05-05',                          // 어린이날
    '2027-05-13',                          // 부처님오신날
    '2027-06-06',                          // 현충일(일) - 대체 없음
    '2027-07-17',                          // 제헌절
    '2027-08-15','2027-08-16',             // 광복절(일) + 대체(월)
    '2027-09-14','2027-09-15','2027-09-16',// 추석 연휴
    '2027-10-03','2027-10-04',             // 개천절(일) + 대체(월)
    '2027-10-09','2027-10-11',             // 한글날(토) + 대체(월)
    '2027-12-25','2027-12-27',             // 크리스마스(토) + 대체(월)
  ];
  return holidays.includes(dateStr);
}


/* ============================================================
   30분 단위 시간 select 옵션 생성
   ============================================================ */
function buildTimeOptions(selId, defaultVal) {
  const sel = document.getElementById(selId);
  if (!sel) return;
  sel.innerHTML = '';
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const val = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      if (val === defaultVal) opt.selected = true;
      sel.appendChild(opt);
    }
  }
}

/* 시간외근무 토글 */
let _otChecked = true;
function toggleOtCheck() {
  _otChecked = !_otChecked;
  const card = document.getElementById('ot-card');
  const box  = document.getElementById('chk-ot');
  const lbl  = document.getElementById('lbl-ot');
  const sub  = document.getElementById('sub-ot');
  card.className = _otChecked ? 'chk-card on' : 'chk-card off';
  box.className  = _otChecked ? 'chk-box on'  : 'chk-box off';
  lbl.className  = _otChecked ? 'chk-label on': 'chk-label off';
  sub.className  = _otChecked ? 'chk-sub on'  : 'chk-sub off';
  calcOvertime();
}

/* 저녁식사 토글 */
let _dinnerChecked = false;
function toggleDinnerCheck() {
  _dinnerChecked = !_dinnerChecked;
  const card = document.getElementById('dinner-card');
  const box  = document.getElementById('chk-dinner');
  const lbl  = document.getElementById('lbl-dinner');
  const sub  = document.getElementById('sub-dinner');
  card.className = _dinnerChecked ? 'chk-card on' : 'chk-card off';
  box.className  = _dinnerChecked ? 'chk-box on'  : 'chk-box off';
  lbl.className  = _dinnerChecked ? 'chk-label on': 'chk-label off';
  sub.className  = _dinnerChecked ? 'chk-sub on'  : 'chk-sub off';
  calcOvertime();
}

/* ============================================================
   GAS 통신 — JSONP
   ============================================================ */
function gasRequest(params, retryCount = 0) {
  // ① submit/submitWithCheck/deleteRow 는 재시도 금지 (중복 저장 방지)
  const NO_RETRY_ACTIONS = ['submit', 'submitWithCheck', 'deleteRow'];
  const noRetry = NO_RETRY_ACTIONS.includes(params.action);

  return new Promise((resolve, reject) => {
    const cbName = 'gas_cb_' + Date.now() + '_' + Math.floor(Math.random()*99999);
    const timer = setTimeout(() => {
      cleanup();
      if (!noRetry && retryCount < 1) {
        gasRequest(params, retryCount + 1).then(resolve).catch(reject);
      } else {
        reject(new Error('요청 시간 초과'));
      }
    }, 30000);
    window[cbName] = (data) => { cleanup(); resolve(data); };
    function cleanup() {
      clearTimeout(timer);
      delete window[cbName];
      const el = document.getElementById(cbName);
      if (el) el.remove();
    }
    const qs = Object.entries({ ...params, callback: cbName })
      .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    const script = document.createElement('script');
    script.id = cbName;
    script.src = `${GAS_URL}?${qs}`;
    script.onerror = () => {
      cleanup();
      if (!noRetry && retryCount < 1) {
        gasRequest(params, retryCount + 1).then(resolve).catch(reject);
      } else {
        reject(new Error('네트워크 오류'));
      }
    };
    document.body.appendChild(script);
  });
}

function gasPostRequest(params, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const cbName = 'gas_cb_' + Date.now() + '_' + Math.floor(Math.random()*99999);
    const timer = setTimeout(() => {
      cleanup();
      if (retryCount < 1) {
        gasPostRequest(params, retryCount + 1).then(resolve).catch(reject);
      } else {
        reject(new Error('요청 시간 초과'));
      }
    }, 30000);
    window[cbName] = (data) => { cleanup(); resolve(data); };
    function cleanup() {
      clearTimeout(timer);
      delete window[cbName];
      const f = document.getElementById('gas-form-' + cbName);
      const s = document.getElementById(cbName);
      if (f) f.remove();
      if (s) s.remove();
    }
    const iframeName = 'gas_iframe_' + cbName;
    const iframe = document.createElement('iframe');
    iframe.name  = iframeName;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const form = document.createElement('form');
    form.id     = 'gas-form-' + cbName;
    form.method = 'POST';
    form.action = GAS_URL;
    form.target = iframeName;
    form.style.display = 'none';
    const allParams = { ...params, callback: cbName };
    Object.entries(allParams).forEach(([k, v]) => {
      const input = document.createElement('input');
      input.type  = 'hidden';
      input.name  = k;
      input.value = String(v);
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    iframe.onload = () => {};
  });
}

/* ============================================================
   신청인 목록 관리
   ============================================================ */
/* ============================================================
   신청인 목록 — GAS 스프레드시트 연동
   ============================================================ */

/* ============================================================
   신청인 목록 — GAS 스프레드시트 연동 (Promise 방식)
   ============================================================ */

// GAS에서 신청인 목록 로드 → select 갱신
function refreshNameSelect() {
  gasRequest({ action: 'getMembers' })
    .then(res => {
      const members = (res && res.success && res.members)
        ? res.members.map(m => m.name)
        : [...DEFAULT_MEMBERS];
      try { localStorage.setItem('overtime_members', JSON.stringify(members)); } catch(e) {}
      applyMembersToSelect(members);
    })
    .catch(() => {
      let members = [...DEFAULT_MEMBERS];
      try { const s = localStorage.getItem('overtime_members'); if (s) members = JSON.parse(s); } catch(e) {}
      applyMembersToSelect(members);
    });
}

function applyMembersToSelect(members) {
  ['name','filter-name'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = id === 'filter-name'
      ? '<option value="">전체</option>'
      : '<option value="">-- 이름 선택 --</option>';
    members.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m; opt.textContent = m;
      sel.appendChild(opt);
    });
    sel.value = cur;
  });
}

function renderMemberList() {
  const wrap = document.getElementById('member-list');
  if (!wrap) return;
  wrap.innerHTML = '<div style="padding:12px 0;color:#9AA3B2;font-size:0.85rem;">불러오는 중...</div>';
  gasRequest({ action: 'getMembers' })
    .then(res => {
      const members = (res && res.success && res.members) ? res.members : [];
      if (!members.length) {
        wrap.innerHTML = '<div class="no-data" style="border:none;padding:20px 0;">등록된 신청인이 없습니다.</div>';
        return;
      }
      wrap.innerHTML = members.map((m, i) => `
        <div class="member-item">
          <span class="member-name">${i+1}. ${m.name}</span>
          <button class="btn-delete-member" onclick="deleteMember('${m.name.replace(/'/g,"\'")}')">삭제</button>
        </div>`).join('');
    })
    .catch(() => {
      wrap.innerHTML = '<div class="no-data" style="border:none;padding:20px 0;color:#E53E3E;">목록 불러오기 실패</div>';
    });
}

function addMember() {
  const input = document.getElementById('new-member');
  const errEl = document.getElementById('err-member');
  const name  = input.value.trim();
  if (!name) { errEl.textContent = '이름을 입력해 주세요.'; return; }
  errEl.textContent = '';

  gasRequest({ action: 'addMember', name: name, password: ADMIN_PASSWORD })
    .then(res => {
      if (res && res.success) {
        input.value = '';
        renderMemberList();
        refreshNameSelect();
        showToast(`✅ "${name}" 추가되었습니다.`, 'success');
      } else {
        errEl.textContent = (res && res.error) ? res.error : '추가 실패';
      }
    })
    .catch(() => { errEl.textContent = '서버 연결 실패. 다시 시도해 주세요.'; });
}

function deleteMember(name) {
  if (!confirm(`"${name}"을(를) 삭제할까요?`)) return;

  gasRequest({ action: 'deleteMember', name: name, password: ADMIN_PASSWORD })
    .then(res => {
      if (res && res.success) {
        renderMemberList();
        refreshNameSelect();
        showToast(`🗑️ "${name}" 삭제되었습니다.`, '');
      } else {
        showToast((res && res.error) ? res.error : '삭제 실패', 'error');
      }
    })
    .catch(() => { showToast('서버 연결 실패. 다시 시도해 주세요.', 'error'); });
}

/* ============================================================
   초기화
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('today-date').textContent = getTodayLabel();
  document.getElementById('work-date').value = getTodayKST();

  // 30분 단위 시간 옵션 생성
  buildTimeOptions('start-time', '08:30');
  buildTimeOptions('end-time',   '17:30');

  // 시간외 근무 초기 상태 off
  _otChecked = false;
  document.getElementById('ot-card').className     = 'chk-card off';
  document.getElementById('chk-ot').className      = 'chk-box off';
  document.getElementById('lbl-ot').className      = 'chk-label off';
  document.getElementById('sub-ot').className      = 'chk-sub off';

  // 저녁식사 초기 상태 off
  _dinnerChecked = false;
  document.getElementById('dinner-card').className  = 'chk-card off';
  document.getElementById('chk-dinner').className   = 'chk-box off';
  document.getElementById('lbl-dinner').className   = 'chk-label off';
  document.getElementById('sub-dinner').className   = 'chk-sub off';

  refreshNameSelect();
  document.getElementById('btn-submit').addEventListener('click', submitForm);
  ['start-time','end-time'].forEach(id =>
    document.getElementById(id).addEventListener('change', calcOvertime));
  document.querySelectorAll('input[name="attendance"]').forEach(r =>
    r.addEventListener('change', calcOvertime));
  document.getElementById('work-date').addEventListener('change', calcOvertime);
  document.getElementById('reason').addEventListener('input', () => {
    document.getElementById('char-count').textContent =
      `${document.getElementById('reason').value.length} / 500`;
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
  calcOvertime();
});

/* ============================================================
   시간외 근무 자동 계산
   토/일/공휴일이면 시외 = 총근무시간 전체
   ============================================================ */
function calcOvertime() {
  const startVal   = document.getElementById('start-time').value;
  const endVal     = document.getElementById('end-time').value;
  const hasDinner  = _dinnerChecked;
  const attendance = getAttendance();
  const workDate   = document.getElementById('work-date').value;

  document.getElementById('dinner-row').style.display = hasDinner ? 'flex' : 'none';

  const attRow = document.getElementById('att-row');
  if (attendance) {
    attRow.style.display = 'flex';
    document.getElementById('att-deduct-label').textContent = `근태: ${attendance}`;
  } else {
    attRow.style.display = 'none';
  }

  // 연차/교육/예비군 선택 시 근무시간 0 처리
  if (attendance === '연차' || attendance === '교육' || attendance === '예비군') {
    document.getElementById('actual-display').textContent   = '0시간 0분';
    document.getElementById('overtime-display').textContent = '0시간 0분';
    document.getElementById('ot-notice-row').style.display  = 'none';
    window._actualLabel   = '0시간 0분';
    window._overtimeLabel = '0시간 0분';
    document.getElementById('reason').placeholder = attendance;
    return;
  }

  if (!startVal || !endVal) {
    document.getElementById('actual-display').textContent   = '-';
    document.getElementById('overtime-display').textContent = '0시간 0분';
    return;
  }

  const s = timeToMin(startVal);
  const e = timeToMin(endVal);

  if (e <= s) {
    document.getElementById('err-time').textContent         = '퇴근시간은 출근시간보다 늦어야 합니다.';
    document.getElementById('actual-display').textContent   = '-';
    document.getElementById('overtime-display').textContent = '시간 오류';
    return;
  }
  document.getElementById('err-time').textContent = '';

  const totalWork    = e - s;
  const baseWork     = overlap(s, e, WORK_START, WORK_END);
  const isHalfDay    = (attendance === '반차');
  const lunchDeduct  = isHalfDay ? 0 : overlap(s, e, LUNCH_START, LUNCH_END);
  const dinnerDeduct = hasDinner ? overlap(s, e, DIN_START, DIN_END) : 0;
  const actualWork   = Math.max(0, totalWork - lunchDeduct - dinnerDeduct);
  const basePure     = baseWork - lunchDeduct;

  document.getElementById('actual-display').textContent = minToLabel(actualWork);
  window._actualLabel = minToLabel(actualWork);

  // 시간외 미체크 시 시외 0
  if (!_otChecked) {
    document.getElementById('overtime-display').textContent = '0시간 0분';
    document.getElementById('ot-notice-row').style.display  = 'block';
    window._overtimeLabel = '0시간 0분';
    return;
  }
  document.getElementById('ot-notice-row').style.display = 'none';

  // 토/일/공휴일이면 시외 = 총근무시간 전체
  const isWkndHol = isWeekendOrHolidayJS(workDate);
  const overtime  = isWkndHol ? actualWork : Math.max(0, actualWork - basePure);

  document.getElementById('overtime-display').textContent = minToLabel(overtime);
  window._overtimeLabel = minToLabel(overtime);

  const reasonEl = document.getElementById('reason');
  reasonEl.placeholder = overtime > 0 ? '시외 근무 사유를 입력해 주세요.' : '정규 근무 사유를 입력해 주세요.';
}

/* ============================================================
   페이지 / 탭 전환
   ============================================================ */
function showPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${pageName}`).classList.add('active');
  window.scrollTo(0, 0);
}
function switchTab(tab) {
  document.getElementById('tab-data').classList.toggle('active',   tab === 'data');
  document.getElementById('tab-member').classList.toggle('active', tab === 'member');
  document.getElementById('panel-data').style.display   = tab === 'data'   ? 'block' : 'none';
  document.getElementById('panel-member').style.display = tab === 'member' ? 'block' : 'none';
  if (tab === 'member') renderMemberList();
}

/* ============================================================
   유효성 검증
   ============================================================ */
function validateForm() {
  let valid = true;
  const checks = [
    ['name',      document.getElementById('name').value,          '이름을 선택해 주세요.',      'err-name'],
    ['job',       document.getElementById('job').value,           '직무를 선택해 주세요.',      'err-job'],
    ['work-date', document.getElementById('work-date').value,     '근무 날짜를 선택해 주세요.', 'err-date'],
    ['reason',    document.getElementById('reason').value.trim(), '근무 사유를 입력해 주세요.', 'err-reason'],
  ];
  checks.forEach(([id, val, msg, errId]) => {
    if (!val) { setError(errId, msg, id); valid = false; }
    else        clearError(errId, id);
  });
  const s = document.getElementById('start-time').value;
  const e = document.getElementById('end-time').value;
  if (s && e && timeToMin(e) <= timeToMin(s)) {
    setError('err-time', '퇴근시간은 출근시간보다 늦어야 합니다.', 'start-time');
    valid = false;
  } else { clearError('err-time', 'start-time'); }
  return valid;
}
function setError(errId, msg, inputId) {
  document.getElementById(errId).textContent = msg;
  if (inputId) document.getElementById(inputId).classList.add('error');
}
function clearError(errId, inputId) {
  document.getElementById(errId).textContent = '';
  if (inputId) document.getElementById(inputId).classList.remove('error');
}

/* ============================================================
   신청 제출
   ============================================================ */
let _isSubmitting   = false;
let _pendingPayload = null;
let _dupRowIndex    = null;

async function submitForm() {
  // ② 중복 클릭 완전 차단
  if (_isSubmitting) return;
  _isSubmitting = true;
  const btn = document.getElementById('btn-submit');
  btn.disabled = true;
  if (!validateForm()) { btn.disabled = false; return; }
  const payload = {
    action:     'submitWithCheck',
    name:       document.getElementById('name').value,
    job:        document.getElementById('job').value,
    workDate:   document.getElementById('work-date').value,
    startTime:  document.getElementById('start-time').value,
    endTime:    document.getElementById('end-time').value,
    attendance: getAttendance(),
    dinner:     _dinnerChecked ? 'Y' : 'N',
    actualWork: window._actualLabel   || '0시간 0분',
    overtime:   window._overtimeLabel || '0시간 0분',
    reason:     document.getElementById('reason').value.trim(),
    appliedAt:  getNowISO(),
  };
  _isSubmitting = true;
  setLoading(true, '신청 중...');
  try {
    const result = await gasRequest(payload);
    if (result && result.duplicate) {
      _pendingPayload = payload;
      _dupRowIndex    = result.rowIndex;
      setLoading(false); _isSubmitting = false;
      document.getElementById('dup-modal-desc').innerHTML =
        `<strong>${payload.name}</strong>님의 <strong>${payload.workDate}</strong> 신청 내역이 이미 있습니다.<br><br>` +
        `기존: ${result.startTime} ~ ${result.endTime}<br>` +
        `새로: ${payload.startTime} ~ ${payload.endTime}<br><br>` +
        `변경하시겠습니까?`;
      document.getElementById('dup-modal-overlay').style.display = 'flex';
      return;
    }
    if (result && result.success) {
      showToast('✅ 신청이 완료되었습니다.', 'success');
      resetForm();
    } else {
      showToast('❌ 오류: ' + ((result && result.error) || '알 수 없는 오류'), 'error');
    }
    setLoading(false); _isSubmitting = false;
  } catch(err) {
    if (err.message.includes('시간 초과')) {
      showToast('⚠️ 응답이 느립니다. 저장은 완료됐을 수 있어요.', '', 5000);
      resetForm();
    } else {
      showToast('❌ 오류: ' + err.message, 'error');
    }
    setLoading(false); _isSubmitting = false;
  }
}

function closeDupModal() {
  _pendingPayload = null; _dupRowIndex = null;
  document.getElementById('dup-modal-overlay').style.display = 'none';
  setLoading(false); _isSubmitting = false;
  showToast('기존 신청 내역을 유지합니다.', '');
}

async function confirmOverwrite() {
  document.getElementById('dup-modal-overlay').style.display = 'none';
  if (!_pendingPayload || !_dupRowIndex) return;
  const payload  = _pendingPayload;
  const rowIndex = _dupRowIndex;
  _pendingPayload = null; _dupRowIndex = null;
  setLoading(true, '기존 데이터 삭제 중...'); _isSubmitting = true;
  try {
    const delResult = await gasRequest({
      action:   'deleteRow',
      password: ADMIN_PASSWORD,
      rowIndex: rowIndex,
    });
    if (!delResult || !delResult.success) {
      showToast('❌ 삭제 실패: ' + ((delResult && delResult.error) || '오류'), 'error');
      setLoading(false); _isSubmitting = false;
      return;
    }
    setLoading(true, '새로 저장 중...');
    await new Promise(r => setTimeout(r, 500));
    const result = await gasRequest(payload);
    if (result && result.success) {
      showToast('✅ 변경이 완료되었습니다.', 'success');
      resetForm();
    } else {
      showToast('❌ 오류: ' + ((result && result.error) || '알 수 없는 오류'), 'error');
    }
  } catch(err) {
    showToast('❌ 변경 오류: ' + err.message, 'error');
  } finally {
    setLoading(false); _isSubmitting = false;
  }
}

function setLoading(isLoading, msg = '신청하기') {
  document.getElementById('btn-text').textContent      = isLoading ? msg : '신청하기';
  document.getElementById('btn-spinner').style.display = isLoading ? 'inline-block' : 'none';
  document.getElementById('btn-submit').disabled       = isLoading;
}

function resetForm() {
  document.getElementById('name').value       = '';
  document.getElementById('job').value        = '';
  document.getElementById('work-date').value  = getTodayKST();
  // 시간 select 초기화
  const startSel = document.getElementById('start-time');
  const endSel   = document.getElementById('end-time');
  if (startSel) startSel.value = '08:30';
  if (endSel)   endSel.value   = '17:30';
  // 시간외 off 초기화
  if (_otChecked) toggleOtCheck();
  // 저녁식사 off 초기화
  if (_dinnerChecked) toggleDinnerCheck();
  document.getElementById('att-none').checked = true;
  document.getElementById('reason').value     = '';
  document.getElementById('char-count').textContent = '0 / 500';
  ['name','job','work-date','start-time','end-time','reason'].forEach(id =>
    document.getElementById(id).classList.remove('error'));
  ['err-name','err-job','err-date','err-time','err-reason'].forEach(id =>
    document.getElementById(id).textContent = '');
  calcOvertime();
}

/* ============================================================
   관리자
   ============================================================ */
let _adminLoggedIn = false;
let _adminData     = [];

function adminLogin() {
  const pw = document.getElementById('admin-pw').value;
  if (pw === ADMIN_PASSWORD) {
    _adminLoggedIn = true;
    document.getElementById('admin-pw').value = '';
    document.getElementById('err-admin-pw').textContent = '';
    showPage('admin'); refreshNameSelect();
    const today = getTodayKST();
    document.getElementById('filter-start').value = today.slice(0,7) + '-01';
    document.getElementById('filter-end').value   = today;
    fetchAdminData();
  } else {
    document.getElementById('err-admin-pw').textContent = '비밀번호가 올바르지 않습니다.';
  }
}
function adminLogout() { _adminLoggedIn = false; _adminData = []; showPage('form'); }

async function fetchAdminData() {
  if (!_adminLoggedIn) return;
  document.getElementById('admin-tbody').innerHTML =
    '<tr><td colspan="12" style="text-align:center;padding:20px;">조회 중...</td></tr>';
  document.getElementById('admin-table-wrap').style.display = 'block';
  document.getElementById('no-data').style.display          = 'none';
  document.getElementById('summary-card').style.display     = 'none';
  document.getElementById('btn-csv').style.display          = 'none';
  try {
    const json = await gasRequest({
      action:    'getData',
      password:  ADMIN_PASSWORD,
      startDate: document.getElementById('filter-start').value || '',
      endDate:   document.getElementById('filter-end').value   || '',
      name:      document.getElementById('filter-name').value  || '',
      job:       document.getElementById('filter-job').value   || '',
    });
    if (json.success && json.data && json.data.length > 0) {
      _adminData = json.data;
      renderAdminTable(json.data);
      renderSummary(json.data);
    } else {
      _adminData = [];
      document.getElementById('admin-table-wrap').style.display = 'none';
      document.getElementById('no-data').style.display = 'block';
      document.getElementById('no-data').textContent   = '조회된 데이터가 없습니다.';
    }
  } catch(err) {
    showToast('조회 오류: ' + err.message, 'error');
    document.getElementById('admin-table-wrap').style.display = 'none';
    document.getElementById('no-data').style.display = 'block';
    document.getElementById('no-data').textContent   = '조회 중 오류가 발생했습니다.';
  }
}

function renderAdminTable(data) {
  const tbody = document.getElementById('admin-tbody');
  tbody.innerHTML = '';
  data.forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><button class="btn-delete-row" onclick="openDeleteModal(${idx})">🗑 삭제</button></td>
      <td>${row.appliedAt  || ''}</td>
      <td>${row.name       || ''}</td>
      <td>${row.job        || ''}</td>
      <td>${row.workDate   || ''}</td>
      <td>${row.startTime  || ''}</td>
      <td>${row.endTime    || ''}</td>
      <td>${row.attendance || '-'}</td>
      <td>${row.dinner === 'Y' ? '✓' : '-'}</td>
      <td>${row.actualWork || ''}</td>
      <td style="color:#1B6FE8;font-weight:600;">${row.overtime || ''}</td>
      <td class="reason-cell" title="${(row.reason||'').replace(/"/g,'&quot;')}">${row.reason||''}</td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('admin-table-wrap').style.display = 'block';
  document.getElementById('btn-csv').style.display          = 'block';
}

function renderSummary(data) {
  let totalOTMin = 0, totalActMin = 0;
  data.forEach(row => {
    const p = (str) => {
      const h = (str.match(/(\d+)시간/) || [0,0])[1];
      const m = (str.match(/(\d+)분/)   || [0,0])[1];
      return Number(h)*60 + Number(m);
    };
    totalOTMin  += p(row.overtime   || '');
    totalActMin += p(row.actualWork || '');
  });
  document.getElementById('sum-count').textContent  = `${data.length}건`;
  document.getElementById('sum-actual').textContent = minToLabel(totalActMin);
  document.getElementById('sum-hours').textContent  = minToLabel(totalOTMin);
  document.getElementById('summary-card').style.display = 'block';
}

let _deleteTargetIdx = null;
function openDeleteModal(idx) {
  _deleteTargetIdx = idx;
  const row = _adminData[idx];
  document.getElementById('modal-desc').textContent =
    `${row.name} · ${row.workDate} · ${row.overtime} 내역을 삭제할까요?`;
  document.getElementById('modal-overlay').style.display = 'flex';
}
function closeModal() {
  _deleteTargetIdx = null;
  document.getElementById('modal-overlay').style.display = 'none';
}
async function confirmDelete() {
  if (_deleteTargetIdx === null) return;
  const row = _adminData[_deleteTargetIdx];
  closeModal();
  try {
    const result = await gasRequest({
      action:   'deleteRow',
      password: ADMIN_PASSWORD,
      rowIndex: row.rowIndex,
    });
    if (result.success) {
      showToast('🗑️ 삭제되었습니다.', '');
      await fetchAdminData();
    } else {
      showToast('삭제 실패: ' + (result.error || '오류'), 'error');
    }
  } catch(err) { showToast('삭제 오류: ' + err.message, 'error'); }
}

function downloadCSV() {
  if (!_adminData.length) { showToast('다운로드할 데이터가 없습니다.', 'error'); return; }
  const headers = ['신청일시','이름','직무','근무날짜','출근','퇴근','근태','저녁','실근무','시간외근무','사유'];
  const rows = _adminData.map(r => [
    `"${r.appliedAt||''}"`, `"${r.name||''}"`,       `"${r.job||''}"`,
    `"${r.workDate||''}"`,  `"${r.startTime||''}"`,  `"${r.endTime||''}"`,
    `"${r.attendance||''}"`,`"${r.dinner==='Y'?'예':'아니오'}"`,
    `"${r.actualWork||''}"`,`"${r.overtime||''}"`,
    `"${(r.reason||'').replace(/"/g,'""')}"`,
  ].join(','));
  const csv  = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `시간외근무신청_${getTodayKST()}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

/* ============================================================
   토스트
   ============================================================ */
let _toastTimer = null;
function showToast(msg, type='', duration=3000) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${type}`;
  t.style.display = 'block'; void t.offsetWidth; t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => { t.style.display = 'none'; }, 300);
  }, duration);
}
