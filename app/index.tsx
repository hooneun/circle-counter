import { Button, View, StyleSheet } from "react-native";
import CircularTimer from "./CircularTimer";
import { useState } from "react";
import CircularTimer2 from "./CircularTimer2";

export default function Index() {
	const [isPlaying, setIsPlaying] = useState(false);

	return (
		<View style={styles.container}>
			{/* <CircularTimer
				duration={10}
				size={300}
				strokeWidth={20}
				strokeColor="red"
				isPlaying={isPlaying}
				onComplete={() => {
					console.log("Timer completed");
					setIsPlaying(false);
				}}
				showRemainingTime={true}
			/>

			<View style={styles.buttonContainer}>
				<Button
					title={isPlaying ? "Pause" : "Start"}
					onPress={() => setIsPlaying((prev) => !prev)}
				/>

				{isPlaying && (
					<Button
						title="Reset"
						onPress={() => {
							setIsPlaying(false);
							// 약간의 지연 후 다시 시작하여 타이머가 리셋되도록 함
							setTimeout(() => setIsPlaying(true), 100);
						}}
					/>
				)}
			</View> */}
			<CircularTimer2
				duration={10}
				size={300}
				strokeWidth={20}
				strokeColor="red"
				isPlaying={isPlaying}
				onComplete={() => {
					console.log("Timer completed");
					setIsPlaying(false);
				}}
				showRemainingTime={true}
			/>
			<Button
				title={isPlaying ? "Pause" : "Start"}
				onPress={() => setIsPlaying((prev) => !prev)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	buttonContainer: {
		flexDirection: "row",
		marginTop: 30,
		width: "80%",
		justifyContent: "space-around",
	},
});
