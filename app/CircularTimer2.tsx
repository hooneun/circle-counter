import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { useEffect, useRef, useState, useCallback, memo } from "react";
import { Ionicons } from "@expo/vector-icons";

/**
 * # CircularTimer2 컴포넌트
 *
 * ## 1. 전체 구조
 * CircularTimer2 컴포넌트는 다음과 같은 구성으로 이루어져 있습니다:
 *
 * - **인터페이스 정의**: 컴포넌트의 props에 대한 타입 정의
 * - **커스텀 훅**: 타이머 로직을 담당하는 useTimer 훅
 * - **UI 컴포넌트**: 시각적 표현을 위한 작은 컴포넌트들 (TimerCircle, BaseCircle)
 * - **메인 컴포넌트**: 모든 요소를 조합하는 CircularTimer2 컴포넌트
 * - **스타일 정의**: 컴포넌트의 외관을 결정하는 스타일
 *
 * ## 2. 주요 기능 설명
 *
 * ### 타이머 로직 (useTimer 훅)
 * - **상태 관리**:
 *   - 남은 시간, 타이머 원의 offset, 재생 상태, 초과 시간 상태 등을 관리
 *   - initialDuration ref를 사용해 초기 시간 참조를 유지
 *
 * - **타이머 제어**:
 *   - handlePlayPause: 재생/일시정지 토글 및 초기화
 *   - handleStop: 타이머 정지 및 리셋
 *
 * - **타이머 계산 로직**:
 *   - 일반 시간: 원의 offset은 남은 시간 비율에 따라 계산됨
 *   - 초과 시간: 남은 시간이 0 이하일 때 별도의 시각적 표현 제공
 *   - 초과 시간 비율에 따라 두 번째 원의 offset 조정
 *
 * - **시간 포맷팅**:
 *   - MM:SS 형식으로 시간 표시
 *   - 초과 시간에는 "+" 접두사 추가
 *
 * ### 시각적 표현
 * - **베이스 원 (BaseCircle)**:
 *   - 백그라운드 회색 원으로, 타이머의 총 시간을 나타냄
 *
 * - **타이머 원 (TimerCircle)**:
 *   - 진행 상태를 나타내는 컬러 원
 *   - strokeDasharray와 strokeDashoffset로 원의 채워진 정도 제어
 *
 * - **초과 시간 원**:
 *   - 설정된 시간을 초과했을 때만 표시되는 별도의 원
 *   - 다른 색상(overtimeStrokeColor)으로 초과 시간 상태를 시각적으로 구분
 *
 * ### 컨트롤 버튼
 * - **재생/일시정지 버튼**:
 *   - 타이머 상태에 따라 아이콘 변경 (재생 ↔ 일시정지)
 *
 * - **정지 버튼**:
 *   - 타이머 초기화
 *   - 타이머가 초기 상태일 때는 비활성화됨
 *
 * ## 3. 성능 최적화
 * - **메모이제이션**:
 *   - useCallback으로 핸들러 함수 최적화
 *   - memo로 하위 컴포넌트 리렌더링 최적화
 *
 * - **조건부 렌더링**:
 *   - 초과 시간 원은 필요할 때만 렌더링
 *   - 시간 표시는 showRemainingTime 옵션에 따라 조건부 렌더링
 *
 * ## 4. 코드 구성 원칙
 * - **관심사 분리**: 로직과 UI 표현을 명확하게 분리
 * - **재사용성**: 작은 컴포넌트로 분리하여 재사용 가능하게 구성
 * - **유지보수성**: 명확한 주석과 변수명으로 코드 이해 용이
 * - **확장성**: props를 통해 다양한 설정 및 스타일 적용 가능
 *
 * 이 CircularTimer2 컴포넌트는 효율적인 상태 관리와 애니메이션을 통해 사용자에게 직관적인 시간 시각화 경험을 제공합니다.
 * 초과 시간 기능을 추가하여 설정된 시간을 넘어서도 타이머가 계속 작동하고 시각적으로 구분할 수 있도록 했습니다.
 */

/**
 * CircularTimer2 컴포넌트의 속성(props) 정의
 * @property {number} duration - 타이머의 전체 시간(초 단위)
 * @property {number} size - 타이머 원의 크기(픽셀 단위)
 * @property {number} strokeWidth - 타이머 원의 테두리 두께(픽셀 단위)
 * @property {string} strokeColor - 타이머 원의 색상
 * @property {Function} [onComplete] - 타이머가 완료되었을 때 호출되는 콜백 함수
 * @property {boolean} [showRemainingTime=true] - 남은 시간을 표시할지 여부
 * @property {string} [overtimeStrokeColor="tomato"] - 초과 시간 원의 색상
 */
interface CircularTimer2Props {
	duration: number;
	size: number;
	strokeWidth: number;
	strokeColor: string;
	onComplete?: () => void;
	showRemainingTime?: boolean;
	overtimeStrokeColor?: string;
}

/**
 * 타이머 로직을 관리하는 커스텀 훅
 * 타이머 상태, 시간 포맷, 타이머 제어 함수들을 제공
 *
 * @param {Object} params - 파라미터 객체
 * @param {number} params.duration - 타이머의 전체 시간(초 단위)
 * @param {number} params.circumference - 타이머 원의 둘레
 * @param {Function} [params.onComplete] - 타이머가 완료되었을 때 호출되는 콜백 함수
 * @returns {Object} 타이머 상태와 제어 함수들
 */
function useTimer({
	duration,
	circumference,
	onComplete,
}: {
	duration: number;
	circumference: number;
	onComplete?: () => void;
}) {
	// 타이머 상태 관리를 위한 state 변수들
	const [remainingTime, setRemainingTime] = useState(duration); // 남은 시간(초)
	const [offset, setOffset] = useState(0); // 타이머 원 애니메이션을 위한 offset 값
	const [isPlaying, setIsPlaying] = useState(false); // 타이머가 작동 중인지 여부
	const [isOvertime, setIsOvertime] = useState(false); // 초과 시간 모드인지 여부
	const [overtimeOffset, setOvertimeOffset] = useState(circumference); // 초과 시간 원 애니메이션을 위한 offset 값
	const intervalRef = useRef<NodeJS.Timeout | null>(null); // setInterval 참조 저장
	const initialDuration = useRef(duration); // 초기 타이머 시간을 저장

	/**
	 * 재생/일시정지 토글 핸들러
	 * 초과 시간에서 재생 시 타이머를 리셋
	 */
	const handlePlayPause = useCallback(() => {
		// 초과 시간 상태에서 정지 상태일 때 재생 버튼을 누르면 타이머 초기화
		if (remainingTime <= 0 && !isPlaying) {
			setRemainingTime(duration);
			setOffset(0);
			setIsOvertime(false);
			setOvertimeOffset(circumference);
			initialDuration.current = duration;
		}
		// 재생/일시정지 상태 토글
		setIsPlaying((prev) => !prev);
	}, [remainingTime, isPlaying, duration, circumference]);

	/**
	 * 정지 버튼 핸들러
	 * 타이머를 초기 상태로 리셋
	 */
	const handleStop = useCallback(() => {
		setIsPlaying(false);
		setRemainingTime(duration);
		setOffset(0);
		setIsOvertime(false);
		setOvertimeOffset(circumference);
		// 실행 중인 인터벌 제거
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, [duration, circumference]);

	/**
	 * 타이머 작동 로직
	 * 1초마다 남은 시간을 감소시키고, 원 애니메이션 업데이트
	 */
	useEffect(() => {
		// 타이머가 재생 중이 아니면 인터벌 제거하고 종료
		if (!isPlaying) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			return;
		}

		// 인터벌이 없으면 생성하여 1초마다 타이머 업데이트
		if (!intervalRef.current) {
			intervalRef.current = setInterval(() => {
				setRemainingTime((prev) => {
					const nextTime = prev - 1; // 1초 감소

					// 남은 시간이 0 이하일 경우 (초과 시간)
					if (nextTime <= 0) {
						// 아직 초과 시간 모드가 아니면 모드 전환
						if (!isOvertime) {
							setIsOvertime(true);
							setOffset(0); // 기존 타이머 원을 완전히 채움
							onComplete?.(); // 완료 콜백 호출
						}

						// 초과 시간 원 애니메이션 계산
						const overtimeDuration = initialDuration.current || 60; // 초과 시간 표시 기간(초기 시간만큼)
						const overtimeElapsed = Math.abs(nextTime); // 초과된 시간(양수로 변환)
						const overtimeRatio = Math.min(
							1,
							overtimeElapsed / overtimeDuration, // 초과 시간 비율 (0~1)
						);
						// 초과 시간 원의 offset 설정 (초과 시간이 늘어날수록 원이 채워짐)
						setOvertimeOffset(circumference * (1 - overtimeRatio));
					} else {
						// 남은 시간이 0보다 크면 일반 타이머 원 애니메이션 계산
						const currentRatio = Math.max(
							0,
							nextTime / initialDuration.current, // 남은 시간 비율 (0~1)
						);
						// 타이머 원의 offset 설정 (시간이 줄어들수록 원이 채워짐)
						setOffset(circumference * (1 - currentRatio));
					}

					return nextTime; // 업데이트된 남은 시간 반환
				});
			}, 1000); // 1초 간격
		}

		// 컴포넌트 언마운트 시 인터벌 정리
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [isPlaying, circumference, onComplete, isOvertime]);

	/**
	 * duration prop이 변경될 때 타이머 리셋
	 * 타이머가 재생 중이 아닐 때만 리셋
	 */
	useEffect(() => {
		if (!isPlaying) {
			setRemainingTime(duration);
			setOffset(0);
			setIsOvertime(false);
			setOvertimeOffset(circumference);
			initialDuration.current = duration;
		}
	}, [duration, isPlaying, circumference]);

	/**
	 * 시간을 MM:SS 형식으로 포맷팅
	 * 초과 시간일 경우 "+" 접두사 추가
	 *
	 * @param {number} seconds - 포맷팅할 시간(초)
	 * @returns {string} 포맷팅된 시간 문자열
	 */
	const formatTime = useCallback(
		(seconds: number): string => {
			const displaySeconds = Math.abs(seconds); // 음수 시간도 양수로 표시
			const totalSeconds = Math.floor(displaySeconds);
			const minutes = Math.floor(totalSeconds / 60); // 분 계산
			const remainingSeconds = totalSeconds % 60; // 초 계산

			// 분과 초를 두 자리 숫자로 포맷팅 (앞에 0 추가)
			const formattedTime = `${minutes < 10 ? "0" : ""}${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;

			// 초과 시간이면 "+" 접두사 추가
			return isOvertime ? `+${formattedTime}` : formattedTime;
		},
		[isOvertime],
	);

	// 타이머 상태와 제어 함수들 반환
	return {
		remainingTime,
		offset,
		isPlaying,
		isOvertime,
		overtimeOffset,
		handlePlayPause,
		handleStop,
		formatTime,
	};
}

/**
 * 타이머 원 컴포넌트 - 진행 상태를 시각적으로 표시
 * memo로 감싸 불필요한 리렌더링 방지
 */
const TimerCircle = memo(
	({
		center,
		radius,
		strokeWidth,
		circumference,
		offset,
		strokeColor,
	}: {
		center: number;
		radius: number;
		strokeWidth: number;
		circumference: number;
		offset: number;
		strokeColor: string;
	}) => (
		<Circle
			cx={center}
			cy={center}
			r={radius}
			stroke={strokeColor}
			strokeWidth={strokeWidth}
			fill="none"
			strokeDasharray={circumference} // 원 둘레의 점선 패턴 설정
			strokeDashoffset={offset} // 진행 상태에 따라 변하는 offset
			strokeLinecap="round" // 원의 끝을 둥글게 처리
		/>
	),
);

/**
 * 베이스 원 컴포넌트 - 회색 배경 원 표시
 * memo로 감싸 불필요한 리렌더링 방지
 */
const BaseCircle = memo(
	({
		center,
		radius,
		strokeWidth,
	}: {
		center: number;
		radius: number;
		strokeWidth: number;
	}) => (
		<Circle
			cx={center}
			cy={center}
			r={radius}
			stroke="#E6E6E6" // 회색 배경
			strokeWidth={strokeWidth}
			fill="none"
		/>
	),
);

/**
 * 원형 타이머 메인 컴포넌트
 * 타이머 원과 컨트롤 버튼을 렌더링
 */
const CircularTimer2 = ({
	duration,
	size,
	strokeWidth,
	strokeColor,
	onComplete,
	showRemainingTime = true,
	overtimeStrokeColor = "tomato",
}: CircularTimer2Props) => {
	// 원의 물리적 속성 계산
	const radius = (size - strokeWidth) / 2; // 원의 반지름
	const circumference = 2 * Math.PI * radius; // 원의 둘레
	const center = size / 2; // 원의 중심점

	// 타이머 로직 커스텀 훅 사용
	const {
		remainingTime,
		offset,
		isPlaying,
		isOvertime,
		overtimeOffset,
		handlePlayPause,
		handleStop,
		formatTime,
	} = useTimer({
		duration,
		circumference,
		onComplete,
	});

	// 정지 버튼의 스타일 계산 (동적으로 비활성화 스타일 적용)
	const stopButtonStyle = [
		styles.button,
		styles.stopButton,
		!isPlaying && remainingTime === duration ? styles.buttonDisabled : {},
	];

	return (
		<View style={styles.wrapper}>
			<View style={styles.timerContainer}>
				<Svg width={size} height={size}>
					<G rotation="-90" origin={`${center}, ${center}`}>
						{/* 배경 회색 원 */}
						<BaseCircle
							center={center}
							radius={radius}
							strokeWidth={strokeWidth}
						/>
						{/* 메인 타이머 원 */}
						<TimerCircle
							center={center}
							radius={radius}
							strokeWidth={strokeWidth}
							circumference={circumference}
							offset={offset}
							strokeColor={strokeColor}
						/>
						{/* 초과 시간 원 (초과 시간 상태일 때만 표시) */}
						{isOvertime && (
							<TimerCircle
								center={center}
								radius={radius}
								strokeWidth={strokeWidth}
								circumference={circumference}
								offset={overtimeOffset}
								strokeColor={overtimeStrokeColor}
							/>
						)}
					</G>
				</Svg>
				{/* 남은 시간 텍스트 (showRemainingTime이 true일 때만 표시) */}
				{showRemainingTime && (
					<View style={styles.timeTextContainer}>
						<Text style={styles.timeText}>{formatTime(remainingTime)}</Text>
					</View>
				)}
			</View>

			{/* 컨트롤 버튼 */}
			<View style={styles.buttonContainer}>
				{/* 재생/일시정지 버튼 */}
				<TouchableOpacity style={styles.button} onPress={handlePlayPause}>
					<Ionicons
						name={isPlaying ? "pause" : "play"} // 재생 중이면 일시정지 아이콘, 아니면 재생 아이콘
						size={32}
						color="#FFF"
					/>
				</TouchableOpacity>
				{/* 정지 버튼 */}
				<TouchableOpacity
					style={stopButtonStyle}
					onPress={handleStop}
					disabled={!isPlaying && remainingTime === duration} // 타이머가 초기 상태면 비활성화
				>
					<Ionicons name="stop" size={32} color="#FFF" />
				</TouchableOpacity>
			</View>
		</View>
	);
};

/**
 * 스타일 정의
 */
const styles = StyleSheet.create({
	wrapper: {
		alignItems: "center",
		justifyContent: "center",
	},
	timerContainer: {
		position: "relative", // 절대 위치 자식 요소를 위한 상대 위치 설정
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 40,
	},
	timeTextContainer: {
		...StyleSheet.absoluteFillObject, // 컨테이너 전체를 채우는 절대 위치
		alignItems: "center",
		justifyContent: "center",
	},
	timeText: {
		fontSize: 40,
		fontWeight: "bold",
		color: "#333",
	},
	buttonContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	button: {
		backgroundColor: "#007AFF", // iOS 파란색
		width: 70,
		height: 70,
		borderRadius: 35, // 원형 버튼
		alignItems: "center",
		justifyContent: "center",
		marginHorizontal: 20,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5, // Android 그림자
	},
	stopButton: {
		backgroundColor: "#FF3B30", // iOS 빨간색
	},
	buttonDisabled: {
		backgroundColor: "#D3D3D3", // 회색으로 비활성화 표시
		shadowOpacity: 0.1, // 그림자 감소
		elevation: 1, // Android 그림자 감소
	},
});

// 메모이제이션된 컴포넌트 내보내기 (불필요한 리렌더링 방지)
export default memo(CircularTimer2);
