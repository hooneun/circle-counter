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
	overtimeStrokeColor?: string;
}

export default function CircularTimer2({
	duration,
	size,
	strokeWidth,
	strokeColor,
	onComplete,
	showRemainingTime = true,
	overtimeStrokeColor = "tomato",
}: Omit<CircularTimer2Props, "isPlaying"> & { overtimeStrokeColor?: string }) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const center = size / 2;

	const [remainingTime, setRemainingTime] = useState(duration);
	const [offset, setOffset] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isOvertime, setIsOvertime] = useState(false);
	const [overtimeOffset, setOvertimeOffset] = useState(circumference);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const initialDuration = useRef(duration);

	const formatTime = (seconds: number): string => {
		const displaySeconds = Math.abs(seconds);
		const totalSeconds = Math.floor(displaySeconds);
		const minutes = Math.floor(totalSeconds / 60);
		const remainingSeconds = totalSeconds % 60;

		const formattedTime = `${minutes < 10 ? "0" : ""}${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;

		return isOvertime ? `+${formattedTime}` : formattedTime;
	};

	const handlePlayPause = () => {
		if (remainingTime <= 0 && !isPlaying) {
			setRemainingTime(duration);
			setOffset(0);
			setIsOvertime(false);
			setOvertimeOffset(circumference);
			initialDuration.current = duration;
		}
		setIsPlaying((prev) => !prev);
	};

	const handleStop = () => {
		setIsPlaying(false);
		setRemainingTime(duration);
		setOffset(0);
		setIsOvertime(false);
		setOvertimeOffset(circumference);
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
					const nextTime = prev - 1;

					if (nextTime <= 0) {
						onComplete?.();
						if (!isOvertime) {
							setIsOvertime(true);
							setOffset(0);
						}

						const overtimeDuration = initialDuration.current || 60;
						const overtimeElapsed = Math.abs(nextTime);
						const overtimeRatio = Math.min(
							1,
							overtimeElapsed / overtimeDuration,
						);
						setOvertimeOffset(circumference * (1 - overtimeRatio));
					} else {
						const currentRatio = Math.max(
							0,
							nextTime / initialDuration.current,
						);
						setOffset(circumference * (1 - currentRatio));
					}

					return nextTime;
				});
			}, 1000);
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [isPlaying, circumference, onComplete, isOvertime]);

	useEffect(() => {
		if (!isPlaying) {
			setRemainingTime(duration);
			setOffset(0);
			setIsOvertime(false);
			setOvertimeOffset(circumference);
			initialDuration.current = duration;
		}
	}, [duration, isPlaying, circumference]);

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
						{isOvertime && (
							<Circle
								cx={center}
								cy={center}
								r={radius}
								stroke={overtimeStrokeColor}
								strokeWidth={strokeWidth}
								fill="none"
								strokeDasharray={circumference}
								strokeDashoffset={overtimeOffset}
								strokeLinecap="round"
							/>
						)}
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
