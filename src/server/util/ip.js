module.exports = {
	reachedIpLimit: function (ips, ip, limit) {
		let count = 0;
		for (let i = 0; i < ips.length; i++) {
			if (ip === ips[i]) {
				count++;
				if (count >= limit) {
					return true;
				}
			}
		}
		return count >= limit;
	}
}