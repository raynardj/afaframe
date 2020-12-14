var analyze_rr = () =>{
    var text=document.querySelector("#main_text").value;

    var text_list = find_rr_end(find_rr_start(text.split("\n")));
    
    var aseq = text_list[1];
    var pairs = text_list.slice(2,text_list.length)

    var nodes = create_nodes(aseq);
    for(var i in pairs){
        var pair = pairs[i];
        parse_pair(pair, nodes)
    }
    console.log(nodes)
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

var parse_pair = (pair_string, nodes) => {
    var pair_arr = pair_string.split(" ");
    var node1 = parseInt(pair_arr[0])
    var node2 = parseInt(pair_arr[1])
    var dist = parseFloat(pair_arr[4])
    nodes[node1].add(node2, dist, nodes)
}

class Aminode{
    constructor(idx, amnio_acid, nodes){
        idx = parseInt(idx)
        this.idx = idx;
        this.aa = amnio_acid;
        nodes[idx] = this
        this.buddies = []
    }
    add = (buddy_idx, dist, nodes) =>{
        this.add_buddy(buddy_idx, dist, nodes);
        console.log(buddy_idx)
        nodes[buddy_idx].add_buddy(this.idx, dist, nodes);
    }
    add_buddy=(buddy_idx, dist, nodes)=>{
        this.buddies.push({
            node:nodes[buddy_idx],
            dist
        })
    }
}

$(document).ready(function(){
    $("#analyze_rr").click(analyze_rr)
})