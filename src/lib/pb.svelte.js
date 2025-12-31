// src/lib/pb.svelte.js
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://chois.cloud');

// 전역 상태 정의, 속성별로 상태 정의
let user = $state(pb.authStore.model);
let isValid = $state(pb.authStore.isValid);

// 2. 달력 데이터 관련 전역 상태 (어디서든 접근 가능)
export let calendarState = $state({
    recordId: null,
    memos: {},
    anniversaryInput: ""
});

export const auth = {
    get user() { return user; },
    get isValid() { return isValid; },
    client: pb,

    // async login(email, password) {
	// 		await pb.collection('users').authWithPassword(email, password);
	// 		user = pb.authStore.model;
	// 		isValid = pb.authStore.isValid;		
    // },

    // async logout() { // 구글 오어스 로그아웃
    //     pb.authStore.clear();
	// 	user = null;
	// 	isValid = false
    // },
	// 🌟 전역 저장 함수 (레이아웃에서 호출 가능)
	async syncToCloud(calendarData) {
		if (!user) return alert("로그인이 필요합니다.");

		const lines = calendarData.anniversaryInput.split('\n');
		let hasInvalidFormat = false;

		// 형식이 아예 틀린 것만 체크 (예: "콜론이 없는 줄")
		lines.forEach(line => {
			const trimmed = line.trim();
			if (!trimmed) return;
			// 최소 규격인 '숫자.숫자:' 형태가 아니면 경고
			if (!/^\d+\.\d+\s*:/.test(trimmed)) {
				hasInvalidFormat = true;
			}
		});

		if (hasInvalidFormat) {
			alert("잘못된 형식의 데이터는 무시되거나 달력에 표시되지 않습니다.");
		}
		const data = {
			user: user.id,
			memo: calendarData.memos,
			anniversary: calendarData.anniversaryInput
		};

		try {
			if (calendarData.recordId) {
				await pb.collection('calendar').update(calendarData.recordId, data);
			} else {
				const newRecord = await pb.collection('calendar').create(data);
				calendarData.recordId = newRecord.id;
			}
			alert("클라우드에 저장되었습니다.");
		} catch (err) {
			console.error("저장 실패:", err);
			alert("저장 중 오류가 발생했습니다.");
		}
	},

	 // 🌟 구글 소셜 로그인 추가
    async loginWithGoogle() {
		try {
			// 복잡한 래퍼 없이 PocketBase 기본 함수만 호출
			await pb.collection('users').authWithOAuth2({ 
				provider: 'google' 
			});
			
			if (pb.authStore.isValid) {
				user = pb.authStore.model;
				isValid = true;
			}
		} catch (err) {
			alert("에러 내용: " + err.message);
			console.log(err.message)
		}
	},

	// 1. 일반 이메일 로그인
    async login(email, password) {
        try {
            await pb.collection('users').authWithPassword(email, password);
            user = pb.authStore.model;
            isValid = pb.authStore.isValid;
        } catch (err) {
            alert("로그인 실패: 이메일이나 비밀번호를 확인하세요.");
        }
    },

    // 2. 이메일 회원가입
    async signUp(email, password, name) {
        try {
            const data = {
                "email": email,
                "password": password,
                "passwordConfirm": password, // 비밀번호 확인 강제 일치
				"name": name,
                "emailVisibility": true
            };
            await pb.collection('users').create(data);
            // 가입 직후 바로 로그인 처리
            await this.login(email, password);
            alert(`${name}님 회원가입이 완료되었습니다!`);
        } catch (err) {
            console.error("가입 에러:", err);
            alert("회원가입 실패: " + err.message);
        }
    },

    async logout() {
        pb.authStore.clear();
        user = null;
        isValid = false;

		//다음을 추가함, 메모와 기념일 state초기화
		calendarState.memos = {}; // 로그아웃 시 즉시 삭제
   		calendarState.anniversaryInput = "";
    },



};



// 상태 변화 감지
pb.authStore.onChange((token, model) => {
    user = model;
	isValid = pb.authStore.isValid;
});

