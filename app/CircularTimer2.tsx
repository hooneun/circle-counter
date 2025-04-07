import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface CircularTimer2Props {
	duration: number;
	size: number;
	strokeWidth: number;
	strokeColor: string;
	onComplete?: () => void;
	showRemainingTime?: boolean;
}

export default function CircularTimer2({
	duration,
	size,
	strokeWidth,
	strokeColor,
	onComplete,
	showRemainingTime = true,
}: Omit<CircularTimer2Props, "isPlaying">) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const center = size / 2;

	const [remainingTime, setRemainingTime] = useState(duration);
	const [offset, setOffset] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const initialDuration = useRef(duration);

	const formatTime = (seconds: number, overtime = false): string => {
		const totalSeconds = Math.floor(seconds);
		const minutes = Math.floor(totalSeconds / 60);
		const remainingSeconds = totalSeconds % 60;

		const formattedTime = `${minutes < 10 ? "0" : ""}${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;

		return overtime ? `+${formattedTime}` : formattedTime;
	};

	const handlePlayPause = () => {
		if (remainingTime <= 0 && !isPlaying) {
			setRemainingTime(duration);
			setOffset(0);
			initialDuration.current = duration;
		}
		setIsPlaying((prev) => !prev);
	};

	const handleStop = () => {
		setIsPlaying(false);
		setRemainingTime(duration);
		setOffset(0);
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	};

	useEffect(() => {
		if (!isPlaying) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			return;
		}

		if (!intervalRef.current) {
			intervalRef.current = setInterval(() => {
				setRemainingTime((prev) => {
					if (prev <= 1) {
						if (intervalRef.current) {
							clearInterval(intervalRef.current);
							intervalRef.current = null;
						}

						setOffset(0);
						setIsPlaying(false);

						setTimeout(() => {
							onComplete?.();
						}, 0);

						return 0;
					}

					const currentRatio = Math.max(
						0,
						(prev - 1) / initialDuration.current,
					);
					const nextOffset = circumference * (1 - currentRatio);
					setOffset(nextOffset);

					return prev - 1;
				});
			}, 1000);
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [isPlaying, circumference, onComplete]);

	useEffect(() => {
		if (!isPlaying) {
			setRemainingTime(duration);
			setOffset(0);
			initialDuration.current = duration;
		}
	}, [duration, isPlaying]);

	return (
		<View style={styles.wrapper}>
			<View style={styles.timerContainer}>
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
				{showRemainingTime && (
					<View style={styles.timeTextContainer}>
						<Text style={styles.timeText}>{formatTime(remainingTime)}</Text>
					</View>
				)}
			</View>

			<View style={styles.buttonContainer}>
				<TouchableOpacity style={styles.button} onPress={handlePlayPause}>
					<Ionicons
						name={isPlaying ? "pause" : "play"}
						size={32}
						color="#FFF"
					/>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.button,
						styles.stopButton,
						!isPlaying && remainingTime === duration
							? styles.buttonDisabled
							: {},
					]}
					onPress={handleStop}
					disabled={!isPlaying && remainingTime === duration}
				>
					<Ionicons name="stop" size={32} color="#FFF" />
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		alignItems: "center",
		justifyContent: "center",
	},
	timerContainer: {
		position: "relative",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 40,
	},
	timeTextContainer: {
		...StyleSheet.absoluteFillObject,
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
		backgroundColor: "#007AFF",
		width: 70,
		height: 70,
		borderRadius: 35,
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
		elevation: 5,
	},
	stopButton: {
		backgroundColor: "#FF3B30",
	},
	buttonDisabled: {
		backgroundColor: "#D3D3D3",
		shadowOpacity: 0.1,
		elevation: 1,
	},
});
