// AHA Moment: null == null AND undefined, you can check for both using non-strict equality comparison

const ELEMENTS = {
	INSTRUCTION: document.querySelector("div[class='instruction_body']"),
	ACTIONS: document.querySelector("div[class='instruction_actions']"),
	ARRIVAL: document.getElementById("arrival_time"),
	BURST: document.getElementById("burst_time"),
	PRIORITY: document.getElementById("process_priority"),
	QUANTUM: document.getElementById("quantum_time"),
	TABLE: document.querySelector("div[class*='process_table']"),
	CHART: document.querySelector("div[class*='process_chart_container']"),
	ALGORITHM: document.getElementById("select_algorithm"),
	ARRIVAL_CONTAINER: document.getElementById("arrival_container"),
	BURST_CONTAINER: document.getElementById("burst_container"),
	PRIORITY_CONTAINER: document.getElementById("priority_container"),
	QUANTUM_CONTAINER: document.getElementById("quantum_container"),
	TABLE_COLUMN_TITLE: document.querySelector(".process_column_title"),
};

// Make 99 colors, I'm too lazy to make this dynamic because it requires to change the structure of the code
function create_color() {
	const style = create_element("style", { id: "processes_color", innerText: ":root { " });
	const colors = new Set();
	while (colors.size < 99) {
		const random = Math.floor(Math.random() * 360);
		colors.add(random);
	}

	let i = 0;
	for (let color of colors) {
		const rand_lgt = Math.floor(Math.random() * (100 - 50) + 50);
		const rand_sat = Math.floor(Math.random() * 25);
		style.innerText += `--color-${i}: hsl(${color}, ${rand_sat}%, ${rand_lgt}%);`;
		i++;
	}

	style.innerText += " }";
	document.head.appendChild(style);
}

function order_enum(obj) {
	const keys = Object.keys(obj);
	const ordered_enum = {};
	for (let i = 0; i < keys.length; i++) {
		ordered_enum[keys[i]] = i;
	}
	return Object.freeze(ordered_enum);
}

// Order will reflect in UI
const PROCESS_ENUM = order_enum({
	PID: null,
	AT: null,
	BT: null,
	ST: null,
	CT: null,
	IT: null,
	PR: null,
	TAT: null,
	WT: null,
});

(() => {
	const { INSTRUCTION, ACTIONS, ALGORITHM, ARRIVAL, BURST, PRIORITY, PRIORITY_CONTAINER, QUANTUM_CONTAINER, TABLE_COLUMN_TITLE } = ELEMENTS;
	const process_enum_keys = Object.keys(PROCESS_ENUM);
	let column_title = "";
	for (let i = 0; i < process_enum_keys.length; i++) {
		const key = process_enum_keys[i];
		column_title += `<span>${key}</span>`;
	}

	TABLE_COLUMN_TITLE.innerHTML = column_title;

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
				const algorithm = ALGORITHM.value;
				const arrival_count = ARRIVAL.children.length;
				const burst_count = BURST.children.length;
				const priority_count = PRIORITY.children.length;

				const rand_value_arrival = Math.floor(Math.random() * 20);
				const rand_value_burst = Math.floor(Math.random() * 10);
				const rand_value_priority = Math.floor(Math.random() * 10);

				const rand_arrival = create_element("div", { className: "time_inputs", innerText: String(rand_value_arrival), contentEditable: "true" });
				const rand_burst = create_element("div", { className: "time_inputs", innerText: String(rand_value_burst), contentEditable: "true" });
				const rand_priority = create_element("div", { className: "time_inputs", innerText: String(rand_value_priority), contentEditable: "true" });

				if (arrival_count > burst_count) {
					BURST.insertBefore(rand_burst, BURST.lastElementChild);
					if (priority_count <= arrival_count && algorithm === "prio") PRIORITY.insertBefore(rand_priority, PRIORITY.lastElementChild);
				} else if (arrival_count < burst_count) {
					ARRIVAL.insertBefore(rand_arrival, ARRIVAL.lastElementChild);
					if (priority_count <= arrival_count && algorithm === "prio") PRIORITY.insertBefore(rand_priority, PRIORITY.lastElementChild);
				} else if (arrival_count > priority_count && algorithm === "prio") {
					if (algorithm === "prio") PRIORITY.insertBefore(rand_priority, PRIORITY.lastElementChild);
				} else {
					ARRIVAL.insertBefore(rand_arrival, ARRIVAL.lastElementChild);
					BURST.insertBefore(rand_burst, BURST.lastElementChild);
					if (priority_count <= arrival_count && algorithm === "prio") PRIORITY.insertBefore(rand_priority, PRIORITY.lastElementChild);
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
				update_gantt_chart([]);
				update_table();
				break;
			case "enable_color": {
				const instruction_text = parent.querySelector("span");
				const processes_color = document.getElementById("processes_color");
				if (processes_color) {
					instruction_text.innerText = "Enable color";
					processes_color.remove();
				} else {
					instruction_text.innerText = "Disable color";
					create_color();
				}
				break;
			}
			case "practice_mode":
				const is_practice_on = document.documentElement.classList.contains("practice_on");
				const instruction_text = parent.querySelector("span");
				if (is_practice_on) {
					instruction_text.innerText = "Practice";
					document.documentElement.classList.remove("practice_on");
					parent.classList.remove("finish_practice");
					const answers = document.querySelectorAll("span[data-value]");
					let score = 0;
					for (let i = 0; i < answers.length; i++) {
						const correct_answer = answers[i].dataset.value;
						const user_answer = answers[i].innerText;
						if (correct_answer === user_answer.replace(/\s/g, "")) {
							score += 1;
							answers[i].classList.add("right_answer");
						} else {
							answers[i].classList.add("wrong_answer");
						}
					}
					setTimeout(() => {
						alert(`You scored ${score}/${answers.length}`);
						update_table();
					}, 100);
				} else {
					const answers = document.querySelectorAll("span[data-value]");
					for (let i = 0; i < answers.length; i++) {
						answers[i].classList.remove("right_answer", "wrong_answer");
					}
					instruction_text.innerText = "Finish?";
					parent.classList.add("finish_practice");
					document.documentElement.classList.add("practice_on");
					update_table();
				}

				break;
		}
	});

	INSTRUCTION.addEventListener("input", (event) => {
		setTimeout(() => {
			const { target } = event;
			const target_parent = target.parentElement;

			if (!is_numbers_only(target.innerText)) return;

			if (target_parent.classList.contains("quantum_time")) {
				update_table();
				return;
			}

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
			update_table();
		}, 100);
	});
})();

function calculate_time(algorithm) {
	// --> Formula
	// CT = if start -> AT + BT else -> Previous CT + BT
	// IT = Previous CT - AT
	// TAT = CT - AT
	// WT = TAT - BT

	const { ARRIVAL, BURST, PRIORITY, QUANTUM, CHART } = ELEMENTS;
	const { PID, AT, BT, PR, ST, CT, TAT, WT, IT } = PROCESS_ENUM;

	let processes = [];

	// '- 1' to skip the new_input elements
	for (let i = 0; i < ARRIVAL.children.length - 1; i++) {
		const arrival = parseInt(ARRIVAL.children[i]?.innerText);
		const burst = parseInt(BURST.children[i]?.innerText);
		const priority = parseInt(PRIORITY.children[i]?.innerText);

		const process = [];
		process[PID] = i;
		process[AT] = arrival;
		process[BT] = burst;
		process[PR] = priority;

		processes.push(process);
	}

	// Since inputs might be unordered. Sort them by their arrival time no matter the algorithm
	processes.sort((a, b) => a[AT] - b[AT]);

	switch (algorithm) {
		// --> Non-preemptive
		case "fcfs":
		case "sjf":
		case "prio":
			if (algorithm !== "fcfs") {
				// SJF (Shortest Job First)
				// SJF picks an arrived process from processes with the lowest burst time, using arrival time as a tiebreaker

				// Priority (Non-preemptive)
				// Same as SJF but with priority

				const processes_temp = [];
				let curr_time = 0;

				while (processes.length) {
					// Get the arrvied processes
					const arrived = processes.filter((process) => process[AT] <= curr_time);

					if (arrived.length === 0) {
						// If no process arrived, then the time progressed to the earliest (not-yet arrived) process
						curr_time = processes[0][AT];
						// And execute it
						processes_temp.push(processes.shift());
					} else {
						// If processes arrived, then sort them by their algorithm
						if (algorithm === "sjf") {
							if (arrived.length > 1) arrived.sort((a, b) => (a[BT] !== b[BT] ? a[BT] - b[BT] : a[AT] - b[AT]));
						} else if (algorithm === "prio") {
							if (arrived.length > 1) arrived.sort((a, b) => (a[PR] !== b[PR] ? b[PR] - a[PR] : a[AT] - b[AT]));
						}
						// Find the arrived process from the processes
						// It is not accurate to push the first element in arrived process because the order of processes is not sorted by their burst time and not time-accurate
						const index = processes.findIndex((process) => process[PID] === arrived[0][PID]);
						// Execute the process, note that the time is still not running
						processes_temp.push(processes.splice(index, 1)[0]);
					}

					// Here, we will run the time, emulating the process of executing processes
					// Take the process we just pushed
					const last = processes_temp.at(-1);
					// Compute the completion time, and set the current time to it
					curr_time = Math.max(curr_time, last[AT]) + last[BT];
				}
				processes = processes_temp.map((value) => value);
			}
			update_gantt_chart(processes);
			break;
		// --> Preemptive
		case "rbn":
			if (!is_numbers_only(QUANTUM.innerText)) break;

			const quantum_time = parseInt(QUANTUM.innerText);
			let curr_time = 0;

			const process_queue = [];
			const waiting = processes.map((p) => {
				const proc = [...p];
				proc.remaining = p[BT];
				return proc;
			});
			const completed = [];
			const timeline = [];

			while (waiting.length || process_queue.length) {
				// Enqueue all processes that have arrived by current time
				for (let i = 0; i < waiting.length; ) {
					if (waiting[i][AT] <= curr_time) {
						process_queue.push(waiting.splice(i, 1)[0]);
					} else {
						i++;
					}
				}

				// If nothing is ready, fast-forward to next arrival
				if (process_queue.length === 0 && waiting.length > 0) {
					curr_time = waiting[0][AT];
					continue;
				} else if (process_queue.length === 0) {
					break; // No more processes to execute
				}

				// Follows the FIFO principle
				// Round-robin step
				const proc = process_queue.shift();

				// Set start time if it's the first time executing
				if (proc[ST] === undefined) {
					proc[ST] = curr_time;
				}

				const run_time = Math.min(proc.remaining, quantum_time);
				const process_history = [];
				process_history[PID] = proc[PID];
				timeline.push([process_history]);
				curr_time += run_time;
				proc.remaining -= run_time;

				// Recheck arrivals that may have come during this quantum
				for (let i = 0; i < waiting.length; ) {
					if (waiting[i][AT] <= curr_time) {
						process_queue.push(waiting.splice(i, 1)[0]);
					} else {
						i++;
					}
				}

				if (proc.remaining > 0) {
					process_queue.push(proc); // Still needs CPU time
				} else {
					proc[CT] = curr_time;
					completed.push(proc);
				}
			}

			// Fill in TAT, WT, IT for each completed process
			for (let i = 0; i < completed.length; i++) {
				const p = completed[i];
				const arrival = p[AT];
				const burst = p[BT];
				const completion = p[CT];
				const idle = i === 0 ? 0 + arrival : Math.max(0, arrival - completed[i - 1][CT]);

				p[TAT] = completion - arrival;
				p[WT] = p[TAT] - burst;
				p[IT] = idle;
			}

			processes = completed;
			console.log(timeline);
			update_gantt_chart(timeline);
			break;
		case "srtf":
		case "preemp_prio":
			break;
	}
	if (algorithm !== "rbn") {
		for (let i = 0; i < processes.length; i++) {
			const [_, curr_arrival, curr_burst] = processes[i];

			// Handles three state: start, idle, and not idle
			// If start, current arrival + current burst, otherwise,
			// If was idle, then current process arrival + burst, otherwise, previous process completion + current burst

			// AHA Moment: a > b ? a : b --> Math.max(a,b)
			// AHA Moment: a < b ? a : b --> Math.min(a,b)

			const curr_completion = i === 0 ? curr_arrival + curr_burst : Math.max(curr_arrival, processes[i - 1][PROCESS_ENUM.CT]) + curr_burst;
			const curr_turnaround = curr_completion - curr_arrival;
			const curr_waiting = curr_turnaround - curr_burst;
			const curr_idle = i === 0 ? 0 + curr_arrival : Math.max(0, curr_arrival - processes[i - 1][PROCESS_ENUM.CT]);

			const curr_start = curr_completion - curr_burst;

			processes[i][ST] = curr_start;
			processes[i][CT] = curr_completion;
			processes[i][TAT] = curr_turnaround;
			processes[i][WT] = curr_waiting;
			processes[i][IT] = curr_idle;
		}
	}

	return processes;
}

function find_grid_cell_division(processes) {
	const { BT, AT } = PROCESS_ENUM;
	const max_arrival_time = Math.max(...processes.map((process) => process[AT]));
	const process = processes[processes.findIndex((process) => process[AT] === max_arrival_time)];
	return process[BT] + max_arrival_time;
}

function create_visualization(processes) {
	if (processes.length === 0) {
		document.getElementById("processes_grid")?.remove();
		return;
	}
	const { PID, AT, BT } = PROCESS_ENUM;
	const grid_cell_division = find_grid_cell_division(processes) + 1;

	const processes_grid = create_element("div", { id: "processes_grid" });
	processes_grid.setAttribute(
		"style",
		`
		display: grid;	
		gap: 5px 0;	
		grid-template-rows: repeat(${processes.length}, 1fr);
		grid-template-columns: repeat(${grid_cell_division}, 1fr);
	`
	);

	for (let i = 0; i < grid_cell_division; i++) {
		processes_grid.appendChild(create_element("div", { className: "grid-visual-header", innerText: i }));
	}

	for (let process of processes) {
		const process_el = create_element("div", { innerText: process[PID] + 1 });
		process_el.setAttribute(
			"style",
			`									
			background-color: var(--color-${process[PID]});
			border: 1px solid var(--light-gray);			
			text-align: center;
			grid-column-start: ${process[AT] + 1};
			grid-column-end: ${process[AT] + process[BT] + 1};
		`
		);
		processes_grid.appendChild(process_el);
	}

	console.log(processes_grid);

	document.getElementById("processes_grid")?.remove();
	document.querySelector(".table").appendChild(processes_grid);
}

function update_gantt_chart(processes) {
	const is_practice_on = document.documentElement.classList.contains("practice_on");
	const { CHART } = ELEMENTS;
	const { PID } = PROCESS_ENUM;
	console.log(processes);
	let gantt_chart = create_element("div", {
		style: `grid-template-columns: repeat(${Math.min(10, processes.length)}, 1fr);`,
	});
	for (let i = 0; i < processes.length; i++) {
		const info = create_element("span", { contentEditable: is_practice_on, className: `no_opacity process_order`, style: `background-color: var(--color-${processes[i][PID]})`, innerHTML: `${!is_practice_on ? parseInt(processes[i][PID]) + 1 : ""}` });
		if (is_practice_on) info.dataset.value = parseInt(processes[i][PID]) + 1;
		gantt_chart.appendChild(info);
	}

	const gantt_chart_children = gantt_chart.children;
	for (let i = 0; i < processes.length; i++) {
		setTimeout(() => {
			gantt_chart_children[i].classList.add("process_add_anim");
		}, 50 * i);
	}

	CHART.innerHTML = "";
	CHART.appendChild(gantt_chart);
}

function update_table() {
	const is_practice_on = document.documentElement.classList.contains("practice_on");
	const { TABLE, CHART, ALGORITHM } = ELEMENTS;
	TABLE.innerHTML = "";

	const { PID, AT, BT, CT, TAT, WT, IT, PR } = PROCESS_ENUM;
	const processes = calculate_time(ALGORITHM.value);

	create_visualization(processes);

	let sum_turnaround = 0;
	let sum_waiting = 0;
	const processes_el = [];

	// Add processes
	for (let i = 0; i < processes.length; i++) {
		const process_time = processes[processes.findIndex((process) => process[PID] === i)];

		// Calculate the average
		sum_turnaround += process_time[TAT] ? process_time[TAT] : 0;
		sum_waiting += process_time[WT] ? process_time[WT] : 0;

		const process_info = document.createDocumentFragment();
		const process_enum_keys = Object.keys(PROCESS_ENUM);
		for (let i = 0; i < process_enum_keys.length; i++) {
			const key = PROCESS_ENUM[process_enum_keys[i]];
			const info = create_element("span", {
				className: "no_opacity",
			});
			if (i === 0) {
				info.innerHTML = `${process_time[key] + 1}`;
			} else {
				if (key === AT || key === BT || key === PR || !is_practice_on) {
					info.contentEditable = false;
					info.textContent = process_time[key] || process_time[key] === 0 ? process_time[key] : "-";
				} else {
					info.contentEditable = true;
					info.dataset.value = process_time[key] || process_time[key] === 0 ? process_time[key] : "-";
					info.textContent = "";
				}
			}
			process_info.appendChild(info);
		}

		const process = create_element("div", {
			className: "process",
		});

		processes_el.push(process);

		process.appendChild(process_info);
		TABLE.appendChild(process);
	}

	// Animation for processes
	for (let i = 0; i < processes_el.length; i++) {
		const process_children = processes_el[i].children;

		for (let k = 0; k < process_children.length; k++) {
			if (k === 0) {
				const PID = parseInt(process_children[k].innerText) - 1;
				process_children[k].style = `background-color: var(--color-${PID}); animation: skyfall ${150 * (i + k)}ms ease 0s 1 normal forwards;`;
			} else {
				process_children[k].style = `animation: skyfall ${150 * (i + k)}ms ease 0s 1 normal forwards;`;
			}
		}
	}

	// Add average
	const average_turnaround = sum_turnaround / processes.length;
	const average_waiting = sum_waiting / processes.length;
	const process_average_turnaround = create_element("span", {
		className: "avg_turnaround",
		style: `grid-column-start: ${TAT}; grid-column-start: ${TAT + 1};`,
		innerHTML: `${average_turnaround.toFixed(2)}`,
	});
	const process_average_waiting = create_element("span", {
		className: "avg_waiting",
		style: `grid-column-start: ${WT}; grid-column-start: ${WT + 1};`,
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
	if (isNaN(str)) return false;
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
