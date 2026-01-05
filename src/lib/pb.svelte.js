// src/lib/pb.svelte.js
import PocketBase from 'pocketbase';
import { encryptData } from '$lib/crypto';

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
		if (!user || !user.id) return alert("로그인이 필요합니다.");

		const lines = calendarData.anniversaryInput.split('\n');
		let hasInvalidFormat = false;

		// 1. 형식 검사 로직
		lines.forEach(line => {
			const trimmed = line.trim();
			if (!trimmed) return;
			if (!/^\d+\.\d+\s*:/.test(trimmed)) {
				hasInvalidFormat = true;
			}
		});

		if (hasInvalidFormat) {
			alert("잘못된 형식의 데이터는 무시되거나 달력에 표시되지 않습니다.");
		}

		// 2. 데이터 암호화
		const encryptedMemo = encryptData(calendarData.memos, user.id);
		const encryptedAnniversary = encryptData(calendarData.anniversaryInput, user.id);

		// 3. 전송 데이터 구성 (항상 본인의 user.id를 포함)
		const data = {
			user: user.id,
			memo: encryptedMemo,
			anniversary: encryptedAnniversary
		};

		try {
			let finalRecordId = calendarData.recordId;

			// [중요] recordId가 없거나, 혹시 모를 덮어쓰기를 방지하기 위해 
			// 서버에서 내 ID(user.id)로 된 레코드가 있는지 한 번 더 확인합니다.
			if (!finalRecordId) {
				try {
					const existing = await pb.collection('calendar').getFirstListItem(`user = "${user.id}"`);
					finalRecordId = existing.id;
				} catch (e) {
					// 내 데이터가 서버에 정말 없는 경우 (404) 아래 create 로직으로 넘어감
				}
			}

			if (finalRecordId) {
				// 업데이트 시에도 해당 레코드가 진짜 내 것인지 PocketBase 규칙이 걸러주겠지만, 
				// 코드 레벨에서도 finalRecordId를 사용하여 본인 데이터를 업데이트합니다.
				await pb.collection('calendar').update(finalRecordId, data);
				calendarData.recordId = finalRecordId; 
			} else {
				// 서버에 내 데이터가 아예 없을 때만 새로 생성
				const newRecord = await pb.collection('calendar').create(data);
				calendarData.recordId = newRecord.id;
			}

			alert("개인정보가 암호화되어 안전하게 저장되었습니다.");
		} catch (err) {
			console.error("저장 실패:", err);
			// 만약 권한 에러(403) 등이 나면 남의 데이터를 건드렸을 가능성이 큽니다.
			alert("저장 권한이 없거나 오류가 발생했습니다. 로그인을 다시 확인해주세요.");
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

