module.exports = {
    scale: d3.scale.linear()
        .domain([-2, -1, -0.99, 0.99, 1, 2])
        .range(['#8ea8be', '#d8e1e8', '#ffffff', '#ffffff', '#ffeebd', '#ffdc73'])
        .clamp(true)
};

