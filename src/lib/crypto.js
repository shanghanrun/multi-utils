import CryptoJS from 'crypto-js';

// 암호화 키는 사용자의 ID를 활용하거나 별도의 환경변수를 조합할 수 있습니다.
const getSecretKey = (userId) => {
    return `secret-key-${userId}`; 
};

/**
 * 데이터를 암호화합니다.
 */
export const encryptData = (data, userId) => {
    if (!data || !userId) return data;
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, getSecretKey(userId)).toString();
};

/**
 * 암호화된 데이터를 복호화합니다.
 */
export const decryptData = (encryptedData, userId) => {
    // 1. 데이터가 없거나 문자열이 아니면 그대로 반환
    if (!encryptedData || typeof encryptedData !== 'string' || !userId) return encryptedData;

    // 2. 암호화된 데이터인지 확인 (AES 암호문은 보통 U2FsdGVkX1... 로 시작함)
    if (!encryptedData.startsWith('U2FsdGVkX1')) {
        // 암호화된 형식이 아니라고 판단되면 기존 평문 데이터를 위해 JSON 파싱만 시도
        try {
            return JSON.parse(encryptedData);
        } catch {
            return encryptedData; // 파싱 실패 시 원본 문자열 반환
        }
    }

    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, getSecretKey(userId));
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        
        // 복호화 결과가 비어있다면 (키 불일치 등) 원본 반환
        if (!decryptedString) return encryptedData; 

        return JSON.parse(decryptedString);
    } catch (err) {
        // 복호화 과정에서 에러가 나면 기존 데이터(평문)일 가능성이 높으므로 원본 반환
        console.warn("복호화 건너뜀 (기존 데이터로 간주)");
        try {
            return JSON.parse(encryptedData);
        } catch {
            return encryptedData;
        }
    }
};