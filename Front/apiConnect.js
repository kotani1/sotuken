cause_arr = []
history_arr = []
solution_arr = []
kako_solution_arr = []
$.ajax({
  type: 'GET',
  url: "http://localhost/卒研/body_ana.php",
  dataType: 'json',
}).done(function (data) {
  for(let i=0;i<data.analysis.length;i++){
    if(data.analysis[i].content=='原因'){
      cause_arr.push(data.analysis[i].analysis)
    }else if(data.analysis[i].content=='対策'){
      solution_arr.push(data.analysis[i].analysis)
    }else if(data.analysis[i].content=='歴史'){
      history_arr.push(data.analysis[i].analysis)
    }else if(data.analysis[i].content=='今までされた対策'){
      kako_solution_arr.push(data.analysis[i].analysis)
    }
  }
  for(let i=0; i<cause_arr.length; i++){
    $('#cause').append('<li>'+cause_arr[i]+'</li>')
  }
  for(let i=0; i<solution_arr.length; i++){
    $('#solution').append('<li>'+solution_arr[i]+'</li>')
  }
})
