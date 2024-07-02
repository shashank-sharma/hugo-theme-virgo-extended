export default function greet () {
	let year = new Date().getFullYear();
	console.log("Greetings");
	document.querySelector('#info-date').innerHTML = year;
}