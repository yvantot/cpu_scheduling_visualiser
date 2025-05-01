const ELEMENTS = {
	INSTRUCTION: document.querySelector("div[class='instruction_body']"),
	ACTIONS: document.querySelector("div[class='instruction_actions']"),
	ARRIVAL: document.getElementById("arrival_time"),
	BURST: document.getElementById("burst_time"),
	PRIORITY: document.getElementById("process_priority"),
	TABLE: document.querySelector("div[class*='process_table']"),
	CHART: document.querySelector("div[class*='process_chart_container']"),
	ALGORITHM: document.getElementById("select_algorithm"),
	ARRIVAL_CONTAINER: document.getElementById("arrival_container"),
	BURST_CONTAINER: document.getElementById("burst_container"),
	PRIORITY_CONTAINER: document.getElementById("priority_container"),
	QUANTUM_CONTAINER: document.getElementById("quantum_container"),
};

const PROCESS_ENUM = {
	PID: 0,
	AT: 1,
	BT: 2,
	PR: 3,
	CT: 4,
	TAT: 5,
	WT: 6,
	IT: 7,
};

(() => {
	const { INSTRUCTION, ACTIONS, ALGORITHM, ARRIVAL, BURST, PRIORITY, PRIORITY_CONTAINER, QUANTUM_CONTAINER } = ELEMENTS;

	ALGORITHM.addEventListener("change", () => {
		update_table();

		switch (ALGORITHM.value) {
			case "fcfs":
				PRIORITY_CONTAINER.classList.add("no_display");
				QUANTUM_CONTAINER.classList.add("no_display");
				break;
			case "sjf":
				PRIORITY_CONTAINER.classList.add("no_display");
				QUANTUM_CONTAINER.classList.add("no_display");
				break;
			case "prio":
				PRIORITY_CONTAINER.classList.remove("no_display");
				QUANTUM_CONTAINER.classList.add("no_display");
				break;
			case "rbn":
				PRIORITY_CONTAINER.classList.add("no_display");
				QUANTUM_CONTAINER.classList.remove("no_display");
			default:
				break;
		}
	});

	ACTIONS.addEventListener("click", (event) => {
		const { target } = event;
		const parent = target.closest(".action_container");
		switch (parent.dataset.name) {
			case "add_random":
				const arrival_count = ARRIVAL.children.length;
				const burst_count = BURST.children.length;
				const priority_count = PRIORITY.children.length;

				const rand_value_arrival = Math.floor(Math.random() * 60);
				const rand_value_burst = Math.floor(Math.random() * 60);
				const rand_value_priority = Math.floor(Math.random() * 10);

				const rand_arrival = create_element("div", { className: "time_inputs", innerText: String(rand_value_arrival), contentEditable: "true" });
				const rand_burst = create_element("div", { className: "time_inputs", innerText: String(rand_value_burst), contentEditable: "true" });
				const rand_priority = create_element("div", { className: "time_inputs", innerText: String(rand_value_priority), contentEditable: "true" });

				if (arrival_count > burst_count) {
					BURST.insertBefore(rand_burst, BURST.lastElementChild);
					if (priority_count <= arrival_count) PRIORITY.insertBefore(rand_priority, PRIORITY.lastElementChild);
				} else if (arrival_count < burst_count) {
					ARRIVAL.insertBefore(rand_arrival, ARRIVAL.lastElementChild);
					if (priority_count <= arrival_count) PRIORITY.insertBefore(rand_priority, PRIORITY.lastElementChild);
				} else {
					ARRIVAL.insertBefore(rand_arrival, ARRIVAL.lastElementChild);
					BURST.insertBefore(rand_burst, BURST.lastElementChild);
					if (priority_count <= arrival_count) PRIORITY.insertBefore(rand_priority, PRIORITY.lastElementChild);
				}
				update_table();
				break;
			case "reset_input":
				const inputs = INSTRUCTION.querySelectorAll(".time_inputs");

				for (let i = 0; i < inputs.length; i++) {
					if (!inputs[i].classList.contains("new_input")) {
						inputs[i].remove();
					}
				}
				update_table();
				break;
		}
	});

	INSTRUCTION.addEventListener("keydown", (event) => {
		// Necessary to avoid uncertain behaviour where after keystroke, the value of target is still not updated
		setTimeout(() => {
			const { target } = event;
			const target_parent = target.parentElement;

			// Return if quantum time
			if (target_parent.classList.contains("quantum_time")) return;
			if (!is_numbers_only(parseInt(event.key)) && event.key !== "Backspace") return;

			const parent_children = target_parent.children;
			let is_all_defined = true;

			// Check if all is not empty or defined
			for (let i = 0; i < parent_children.length; i++) {
				is_all_defined = is_all_defined && is_numbers_only(parent_children[i].innerText);
			}

			if (is_all_defined) {
				// Remove new_input state from other elements
				for (let i = 0; i < parent_children.length; i++) {
					parent_children[i].classList.remove("new_input");
				}
				// Append the new_input
				const new_input = create_element("div", { className: "time_inputs new_input", contentEditable: "true" });
				target_parent.appendChild(new_input);
			} else {
				// Remove empty / undefined elements
				for (let i = 0; i < parent_children.length; i++) {
					if (is_empty(parent_children[i].innerText) && !parent_children[i].classList.contains("new_input")) {
						parent_children[i].remove();
						break;
					}
				}
			}

			// Generate table
			update_table();
		}, 100);
	});
})();

function calculate_time(algorithm) {
	// -- Formula --
	// CT = if start -> AT + BT else -> Previous CT + BT
	// IT = Previous CT - AT
	// TAT = CT - AT
	// WT = TAT - BT

	const { ARRIVAL, BURST, PRIORITY } = ELEMENTS;
	const { PID, AT, BT, PR, CT } = PROCESS_ENUM;

	let processes = [];

	// Prepare the processes
	// '- 1' to skip the new_input elements
	for (let i = 0; i < ARRIVAL.children.length - 1; i++) {
		const arrival = parseInt(ARRIVAL.children[i]?.innerText);
		const burst = parseInt(BURST.children[i]?.innerText);
		const priority = parseInt(PRIORITY.children[i]?.innerText);
		processes.push([i, arrival, burst, priority]);
	}

	// Sort based on arrival_time (FCFS)
	if (algorithm === "fcfs") processes.sort((a, b) => a[AT] - b[AT]);

	if (algorithm === "sjf" || algorithm === "prio") {
		processes.sort((a, b) => a[AT] - b[AT]);

		// SJF is an algorithm that orders the process by their burst time, it picks the one with shortest time
		// If they have the same burst time, pick the earliest one that arrived

		const processes_temp = [];
		let curr_time = 0;

		while (processes.length > 0) {
			// Get the arrvied processes
			const arrived = processes.filter((process) => process[AT] <= curr_time);

			if (arrived.length === 0) {
				curr_time = processes[0][AT];
				processes_temp.push(processes.shift());
			} else {
				// Arrived, they may be unordered
				if (algorithm === "sjf") {
					if (arrived.length > 1) arrived.sort((a, b) => (a[BT] !== b[BT] ? a[BT] - b[BT] : a[AT] - b[AT]));
				} else if (algorithm === "prio") {
					if (arrived.length > 1) arrived.sort((a, b) => (a[PR] !== b[PR] ? b[PR] - a[PR] : a[AT] - b[AT]));
				}

				const index = processes.findIndex((process) => process[PID] === arrived[0][PID]);
				processes_temp.push(processes.splice(index, 1)[0]);
			}

			// Calculate the updated time
			const last = processes_temp.at(-1);
			curr_time = Math.max(curr_time, last[AT]) + last[BT];
		}
		processes = processes_temp;
	}

	for (let i = 0; i < processes.length; i++) {
		const [_, curr_arrival, curr_burst] = processes[i];

		// Handles three state: start, idle, and not idle
		// If start, current arrival + current burst, otherwise,
		// If was idle, then current process arrival + burst, otherwise, previous process completion + current burst
		const curr_completion = i === 0 ? curr_arrival + curr_burst : curr_arrival > processes[i - 1][PROCESS_ENUM.CT] ? curr_arrival + curr_burst : processes[i - 1][PROCESS_ENUM.CT] + curr_burst;
		const curr_turnaround = curr_completion - curr_arrival;
		const curr_waiting = curr_turnaround - curr_burst;
		const curr_idle = i === 0 ? 0 + curr_arrival : curr_arrival - processes[i - 1][PROCESS_ENUM.CT] > 0 ? curr_arrival - processes[i - 1][PROCESS_ENUM.CT] : 0;

		processes[i].push(curr_completion);
		processes[i].push(curr_turnaround);
		processes[i].push(curr_waiting);
		processes[i].push(curr_idle);
	}

	return processes;
}

function update_table() {
	const { TABLE, CHART, ALGORITHM } = ELEMENTS;
	TABLE.innerHTML = "";

	const { PID, AT, BT, CT, TAT, WT, IT } = PROCESS_ENUM;
	const processes = calculate_time(ALGORITHM.value);

	let gantt_chart = create_element("div");
	let sum_turnaround = 0;
	let sum_waiting = 0;
	const processes_el = [];

	// Add processes
	for (let i = 0; i < processes.length; i++) {
		const process_time = processes[processes.findIndex((process) => process[PID] === i)];

		gantt_chart.appendChild(create_element("span", { className: `no_opacity process_order`, innerHTML: `${processes[i][PID] + 1}` }));

		// Calculate the average
		sum_turnaround += process_time[TAT] ? process_time[TAT] : 0;
		sum_waiting += process_time[WT] ? process_time[WT] : 0;

		const process = create_element("div", {
			className: "process",
			innerHTML: `
	            <span class="no_opacity">${process_time[PID] + 1}</span>
	            <span class="no_opacity">${process_time[AT] || process_time[AT] === 0 ? process_time[AT] : "-"}</span>
	            <span class="no_opacity">${process_time[BT] || process_time[BT] === 0 ? process_time[BT] : "-"}</span>
	            <span class="no_opacity">${process_time[CT] || process_time[CT] === 0 ? process_time[CT] : "-"}</span>
	            <span class="no_opacity">${process_time[TAT] || process_time[TAT] === 0 ? process_time[TAT] : "-"}</span>
				<span class="no_opacity">${process_time[WT] || process_time[WT] === 0 ? process_time[WT] : "-"}</span>
				<span class="no_opacity">${process_time[IT] || process_time[IT] === 0 ? process_time[IT] : "-"}</span>
	        `,
		});
		processes_el.push(process);
		TABLE.appendChild(process);
	}

	const gantt_chart_children = gantt_chart.children;
	for (let i = 0; i < processes_el.length; i++) {
		const process_children = processes_el[i].children;

		setTimeout(() => {
			gantt_chart_children[i].classList.add("process_add_anim");
		}, 200 * i);

		for (let k = 0; k < process_children.length; k++) {
			setTimeout(() => {
				process_children[k].classList.add("process_add_anim");
			}, 100 * (i + k));
		}
	}

	CHART.innerHTML = "";
	CHART.appendChild(gantt_chart);

	// Add average
	const average_turnaround = sum_turnaround / processes.length;
	const average_waiting = sum_waiting / processes.length;
	const process_average_turnaround = create_element("span", {
		className: "avg_turnaround",
		innerHTML: `${average_turnaround.toFixed(2)}`,
	});
	const process_average_waiting = create_element("span", {
		className: "avg_waiting",
		innerHTML: `${average_waiting.toFixed(2)}`,
	});
	const process_average = create_element("div", {
		className: "process no_opacity",
	});

	if (!isNaN(average_turnaround)) process_average.appendChild(process_average_turnaround);
	if (!isNaN(average_waiting)) process_average.appendChild(process_average_waiting);

	setTimeout(() => {
		process_average.classList.add("process_avg_anim");
	}, 1000);

	TABLE.appendChild(process_average);
}

function is_numbers_only(str, allow_space = false) {
	if (str.length === 0) return false;
	if (allow_space) return /^\s*[\d]+\s*$/.test(str);
	else return /^[\d]+$/.test(str);
}

function is_empty(str) {
	if (str.length === 0) return true;
	if (/^\s*$/.test(str)) return true;
	return false;
}

function create_element(name, attributes = {}) {
	const element = document.createElement(name);
	const keys = Object.keys(attributes);
	if (keys.length !== 0) {
		for (let key of keys) {
			element[key] = attributes[key];
		}
	}
	return element;
}
