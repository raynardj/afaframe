var analyze_rr = () =>{
    var text=document.querySelector("#main_text").value;

    var text_list = find_rr_end(find_rr_start(text.split("\n")));
    
    var aseq = text_list[1];
    var pairs = text_list.slice(2,text_list.length)

    var nodes = create_nodes(aseq);
    const x_list = [];
    const y_list = [];
    for(var i in pairs){
        var pair = pairs[i];
        parse_pair(pair, nodes, x_list, y_list)
    }

    const data_set = [
        tf.tensor(x_list),
        tf.tensor(y_list)
    ]

    train_model(nodes, data_set)
    
    console.log(nodes)
}

var train_model = async (nodes, data_set) => {
    const model = create_model(nodes);
    model.compile({
        optimizer:"adam",
        loss:"meanSquaredError"
    });
    for (let i =1; i<3; i++)
    {
        const h = await model.fit(...data_set, {
            batchSize:32,
            epochs:3
        })
        console.log(
            `Loss after Epoch ${i} : ${h.history.loss}`,
            )
    }
    window.model = model
    visualize(model,nodes)
    console.log(model) 
}

var visualize = async (model, nodes) =>{
    var coords = get_coords(model)
    for(var k in nodes){
        nodes[k].coord = coords[parseInt(k)-1]
    }
    create_vis(Object.values(nodes))
}

var find_rr_start = (arr)=>{
    for(var i in arr){
        var t=arr[i];
        if(t.slice(0,6)=="MODEL "){
            return arr.slice(i,arr.length)
        }
    }
}

var find_rr_end = (arr) => {
    for(var i in arr){
        var t=arr[i];
        if(t=="END"){
            return arr.slice(0,i)
        }
    }
}

var create_nodes = (aseq) =>{
    var nodes = {}
    for(var i in aseq){
        var aa = aseq[i];
        new Aminode(parseInt(i)+1, aa, nodes)
    }
    return nodes
}

var create_vis = (nodes) =>{
    d3.select("#result")
    .selectAll("a-sphere")
    .data(nodes)
    .enter()
    .append("a-sphere")
    .attr("color","#1050E3")
    .attr("radius","0.05")
    .attr("position",function(data){
        var co = data.coord
        var pos = `${co[0]*10} ${co[1]*10} ${co[2]*10}`
        console.log(pos)
        return pos
    })
}

var parse_pair = (pair_string, nodes, x_list, y_list) => {
    var pair_arr = pair_string.split(" ");
    var node1 = parseInt(pair_arr[0])
    var node2 = parseInt(pair_arr[1])
    var dist = parseFloat(pair_arr[4])
    nodes[node1].add(node2, dist, nodes)

    x_list.push([node1-1,node2-1])
    y_list.push([dist])
}

var get_coords = (model) =>{
    var nums = model.layers[1].getWeights()[0].dataSync();
    const result = [];
    for(var i in nums){
        if(i%3==0){
            var slot = []
        }
        slot.push(nums[i])
        if(i%3==2){
            result.push(slot)
        }
    }
    return result
}

class Aminode{
    constructor(idx, amnio_acid, nodes,){
        idx = parseInt(idx)
        this.idx = idx;
        this.aa = amnio_acid;
        nodes[idx] = this
        this.buddies = []
    }
    add = (buddy_idx, dist, nodes) =>{
        this.add_buddy(buddy_idx, dist, nodes);
        nodes[buddy_idx].add_buddy(this.idx, dist, nodes);
    }
    add_buddy=(buddy_idx, dist, nodes)=>{
        this.buddies.push({
            node:nodes[buddy_idx],
            dist
        })
    }
}

class L2Distance extends tf.layers.Layer{
    constructor(){
        super({})
        this.scale = tf.scalar(100)
        this.thresh = tf.scalar(8)
    }
    computeOutputShape(inputShape) { return [-1,1]; }
    call(x, kwargs){
        
        const a = x[0].slice([0,0,0],[-1,1,-1]).mul(this.scale)
        const b = x[0].slice([0,1,0],[-1,1,-1]).mul(this.scale)
        const dist_ = a.sub(b).square().sum([-1]).sqrt()
        
        const dist_sub = this.thresh.sub(dist_)
        // console.log(dist_sub.print())
        return tf.sigmoid(dist_sub)
    }
    getClassName(){
        return 'L2Distance'
    }
}

var create_model=(nodes)=>{
    // console.log(nodes)
    const input = tf.input({shape: [2]});
    const l2 = new L2Distance();
    const emb = tf.layers.embedding(
        {inputDim:Object.keys(nodes).length,outputDim:3})

    const x = emb.apply(input);
    const output = l2.apply(x);
    
    const model = tf.model({inputs: input, outputs: output});
    return model
}

$(document).ready(function(){
    $("#analyze_rr").click(analyze_rr)
})