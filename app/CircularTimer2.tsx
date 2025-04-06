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
	const [offset, setOffset] = useState(1);
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
		if (!isPlaying) return;

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

						// 완료 콜백 호출 (다음 렌더링 사이클에서 처리)
						setTimeout(() => {
							onComplete?.();
						}, 0);

						return 0;
					}

					// 일반적인 타이머 업데이트
					const ratio = (prev - 1) / initialDuration.current;
					const o = circumference * (1 - ratio);
					setOffset(o);

					return prev - 1;
				});
			}, 1000);
			return () => {
				if (intervalRef.current) {
					clearInterval(intervalRef.current);
					intervalRef.current = null;
				}
			};
		}
	}, [isPlaying, remainingTime, circumference, onComplete]);

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
