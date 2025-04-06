import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

/**
 * CircularTimer 컴포넌트의 props 인터페이스
 * @property {number} duration - 타이머의 총 시간(초)
 * @property {number} size - 타이머 원의 크기(픽셀)
 * @property {number} strokeWidth - 타이머 원의 선 두께
 * @property {string} strokeColor - 타이머 원의 색상
 * @property {boolean} isPlaying - 타이머 실행 여부
 * @property {() => void} onComplete - 타이머 완료 시 실행할 콜백 함수
 * @property {boolean} showRemainingTime - 남은 시간 표시 여부
 */
interface CircularTimerProps {
	duration: number;
	size: number;
	strokeWidth: number;
	strokeColor: string;
	isPlaying?: boolean;
	onComplete?: () => void;
	showRemainingTime?: boolean;
}

/**
 * CircularTimer 컴포넌트
 * react-native-countdown-circle-timer와 유사한 원형 타이머 구현
 */
export default function CircularTimer({
	duration,
	size,
	strokeWidth,
	strokeColor,
	isPlaying = true, // 기본값은 실행 중
	onComplete,
	showRemainingTime = true, // 기본값은 남은 시간 표시
}: CircularTimerProps) {
	// 남은 시간 상태 관리 (초 단위)
	const [remainingTime, setRemainingTime] = useState(duration);

	// 초과 시간 상태 관리 (초 단위)
	const [overtimeSeconds, setOvertimeSeconds] = useState(0);

	// 타이머가 초과 상태인지 여부
	const [isOvertime, setIsOvertime] = useState(false);

	// 타이머 인터벌 참조 저장
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	// 원의 반지름 계산 (선 두께를 고려하여 계산)
	const radius = (size - strokeWidth) / 2;

	// 원의 둘레 계산
	const circumference = radius * 2 * Math.PI;

	// 원의 중심 좌표
	const center = size / 2;

	// 타이머 시작 시간 저장 (재시작 시 사용)
	const initialDuration = useRef(duration);

	/**
	 * 타이머 시작 함수
	 * 인터벌을 설정하여 타이머 시작
	 */
	const startTimer = useCallback(() => {
		// 이전 타이머가 있다면 정리
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}

		// 타이머 인터벌 설정 (100ms마다 갱신하여 부드러운 애니메이션 구현)
		intervalRef.current = setInterval(() => {
			if (isOvertime) {
				// 초과 시간 모드인 경우 초과 시간 증가 (100ms마다 0.1초씩 증가)
				setOvertimeSeconds((prev) => prev + 0.1);
			} else {
				// 일반 타이머 모드
				setRemainingTime((prevTime) => {
					// 타이머가 끝났을 때
					if (prevTime <= 0.1) {
						// 초과 시간 모드로 전환 (다음 렌더링 사이클에서 처리)
						setTimeout(() => {
							setIsOvertime(true);
							// 완료 콜백 호출 (상태 업데이트 후에 호출)
							onComplete?.();
						}, 0);
						return 0;
					}
					// 100ms마다 0.1초씩 감소
					return prevTime - 0.1;
				});
			}
		}, 100); // 100ms마다 업데이트하여 부드러운 애니메이션 구현
	}, [isOvertime, onComplete]);

	/**
	 * 타이머 정지 함수
	 * 인터벌을 정지
	 */
	const pauseTimer = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	/**
	 * isPlaying 상태가 변경될 때마다 타이머 시작/정지
	 */
	useEffect(() => {
		if (isPlaying) {
			startTimer();
		} else {
			pauseTimer();
		}

		// 컴포넌트 언마운트 시 정리
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [isPlaying, startTimer, pauseTimer]);

	/**
	 * duration이 변경될 때 타이머 리셋
	 */
	useEffect(() => {
		// duration이 변경되면 초기 값 저장
		initialDuration.current = duration;

		// 타이머 상태 초기화
		setRemainingTime(duration);
		setIsOvertime(false);
		setOvertimeSeconds(0);

		// 타이머가 실행 중이면 재시작
		if (isPlaying) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			startTimer();
		}
	}, [duration, isPlaying, startTimer]);

	/**
	 * 시간 포맷팅 함수 (초 -> 분:초)
	 * @param seconds 초 단위 시간
	 * @param overtime 초과 시간 여부
	 * @returns 포맷팅된 시간 문자열 (예: "1:30" 또는 "+0:05")
	 */
	const formatTime = (seconds: number, overtime = false): string => {
		// 소수점 이하 제거하고 정수로 변환
		const totalSeconds = Math.floor(seconds);
		const minutes = Math.floor(totalSeconds / 60);
		const remainingSeconds = totalSeconds % 60;

		// "분:초" 형식으로 포맷팅 (초가 10 미만이면 앞에 0 추가)
		const formattedTime = `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;

		// 초과 시간인 경우 + 표시 추가
		return overtime ? `+${formattedTime}` : formattedTime;
	};

	/**
	 * 원형 진행률 계산
	 * @returns 진행률에 따른 strokeDashoffset 값
	 */
	const calculateStrokeDashoffset = (): number => {
		if (isOvertime) {
			// 초과 시간일 때는 원을 완전히 채움
			return 0;
		}

		// 남은 시간 비율 계산 (0~1 사이 값)
		const ratio = remainingTime / initialDuration.current;

		// strokeDashoffset 계산 (원이 시계 방향으로 채워지도록)
		return circumference * (1 - ratio);
	};

	return (
		<View style={styles.container}>
			{/* SVG로 원형 타이머 구현 */}
			<Svg width={size} height={size}>
				<G rotation="-90" origin={`${center}, ${center}`}>
					{/* 배경 원 */}
					<Circle
						cx={center}
						cy={center}
						r={radius}
						stroke="#E6E6E6"
						strokeWidth={strokeWidth}
						fill="none"
					/>
					{/* 진행 원 */}
					<Circle
						cx={center}
						cy={center}
						r={radius}
						stroke={isOvertime ? "#FF5722" : strokeColor} // 초과 시간일 때 색상 변경
						strokeWidth={strokeWidth}
						fill="none"
						strokeDasharray={circumference}
						strokeDashoffset={calculateStrokeDashoffset()}
						strokeLinecap="round"
					/>
				</G>
			</Svg>

			{/* 남은 시간 표시 */}
			{showRemainingTime && (
				<View style={styles.timeContainer}>
					<Text style={[styles.timeText, isOvertime && styles.overtimeText]}>
						{isOvertime
							? formatTime(overtimeSeconds, true)
							: formatTime(remainingTime)}
					</Text>
				</View>
			)}
		</View>
	);
}

// 스타일 정의
const styles = StyleSheet.create({
	container: {
		position: "relative",
		alignItems: "center",
		justifyContent: "center",
	},
	timeContainer: {
		position: "absolute",
		alignItems: "center",
		justifyContent: "center",
	},
	timeText: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#333",
	},
	overtimeText: {
		color: "#FF5722", // 초과 시간일 때 텍스트 색상 변경
	},
});
