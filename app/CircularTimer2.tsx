import { Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";

interface CircularTimer2Props {
	duration: number;
	size: number;
	strokeWidth: number;
	strokeColor: string;
	isPlaying?: boolean;
	onComplete?: () => void;
	showRemainingTime?: boolean;
}

export default function CircularTimer2({
	duration,
	size,
	strokeWidth,
	strokeColor,
	isPlaying = false,
	onComplete,
	showRemainingTime = true,
}: CircularTimer2Props) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const center = size / 2;

	const [remainingTime, setRemainingTime] = useState(duration);
	const [offset, setOffset] = useState(0); // 초기 offset을 0으로 설정
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const initialDuration = useRef(duration);

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
		const formattedTime = `${minutes < 10 ? "0" : ""}${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;

		// 초과 시간인 경우 + 표시 추가
		return overtime ? `+${formattedTime}` : formattedTime;
	};

	useEffect(() => {
		if (!isPlaying) {
			// 타이머가 멈췄을 때 인터벌 정리
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			return;
		}

		// 타이머 시작 시 또는 duration 변경 시 초기화
		if (remainingTime <= 0 && duration > 0) {
			setRemainingTime(duration);
			setOffset(0);
			initialDuration.current = duration; // duration 변경 시 initialDuration 업데이트
		}

		if (remainingTime > 0) {
			intervalRef.current = setInterval(() => {
				setRemainingTime((prev) => {
					// 타이머가 끝났을 때 (1초 이하일 때)
					if (prev <= 1) {
						// 타이머 정지
						if (intervalRef.current) {
							clearInterval(intervalRef.current);
							intervalRef.current = null;
						}

						setOffset(0); // 원 애니메이션 초기화 (offset을 0으로 설정)

						// 완료 콜백 호출 (다음 렌더링 사이클에서 처리)
						setTimeout(() => {
							onComplete?.();
						}, 0);

						return 0;
					}

					// 일반적인 타이머 업데이트
					// remainingTime이 initialDuration.current보다 클 경우 ratio가 1 이상이 되어 offset이 음수가 될 수 있으므로 max(0, ...) 추가
					const currentRatio = Math.max(
						0,
						(prev - 1) / initialDuration.current,
					);
					const nextOffset = circumference * (1 - currentRatio);
					setOffset(nextOffset);

					return prev - 1;
				});
			}, 1000);
		} else {
			// duration이 0이거나 음수일 때 처리
			setOffset(0); // 원을 채운 상태로 시작
			setTimeout(() => {
				onComplete?.();
			}, 0);
		}

		// Cleanup 함수: 컴포넌트 언마운트 시 또는 useEffect 재실행 전에 인터벌 정리
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
		// isPlaying, remainingTime, circumference, onComplete, duration을 의존성 배열에 추가
	}, [isPlaying, remainingTime, circumference, onComplete, duration]);

	// duration prop이 변경되었을 때 타이머 상태 업데이트
	useEffect(() => {
		if (!isPlaying) {
			setRemainingTime(duration);
			setOffset(0);
			initialDuration.current = duration;
		}
	}, [duration, isPlaying]);

	return (
		<View style={styles.container}>
			<Svg width={size} height={size}>
				<G rotation="-90" origin={`${center}, ${center}`}>
					<Circle
						cx={center}
						cy={center}
						r={radius}
						stroke="#E6E6E6"
						strokeWidth={strokeWidth}
						fill="none"
					/>

					<Circle
						cx={center}
						cy={center}
						r={radius}
						stroke={strokeColor}
						strokeWidth={strokeWidth}
						fill="none"
						strokeDasharray={circumference}
						strokeDashoffset={offset}
						strokeLinecap="round"
					/>
				</G>
			</Svg>

			<View style={styles.timeContainer}>
				<Text style={styles.timeText}>{formatTime(remainingTime)}</Text>
			</View>
		</View>
	);
}

// 스타일 정의
const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		justifyContent: "center",
	},
	timeContainer: {
		...StyleSheet.absoluteFillObject,
		alignItems: "center",
		justifyContent: "center",
	},
	timeText: {
		fontSize: 24,
		fontWeight: "bold",
	},
});
