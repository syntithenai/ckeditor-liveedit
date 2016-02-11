<?php
$db=array(
    "hostname"  => "localhost",
    "username"  => "admin",
    "password"  => "admin",
    "database"  => "cmfive",
    "driver"    => "mysql"
);

if ($_GET['action']=="poll")  {
	if (intval($_GET['id'])>0 && intval($_GET['dt_modified'])>0) {
		$dbh = new PDO($db['driver'].':host='.$db['hostname'].';dbname='.$db['database'], $db['username'], $db['password']);
		$sql = 'SELECT id,body,unix_timestamp(dt_modified) dt_modified from wiki_page where id='.intval($_GET['id']).' AND unix_timestamp(dt_modified) > '.intval($_GET['dt_modified']) ;
		$rows=[];
		foreach ($dbh->query($sql) as $row) {
			$rows[]=$row;
		}
		$wrap=array('success'=>$rows);
		print_r(json_encode($wrap));
	}
} else if ($_GET['action']=="save")  {
	if (intval($_POST['id'])>0 && !empty($_POST['body'])) {
		
		$dbh = new PDO($db['driver'].':host='.$db['hostname'].';dbname='.$db['database'], $db['username'], $db['password']);
		$sql = "update wiki_page set body='".$_POST['body']."', dt_modified=now() where id=".intval($_POST['id']) ;
		$dbh->query($sql);
	$sql = 'SELECT id,body,unix_timestamp(dt_modified) dt_modified from wiki_page where id='.intval($_POST['id']) ;
		//$sql="select unix_timestamp() from wiki_page";	
		$rows=[];
		foreach ($dbh->query($sql) as $row) {
			$rows[]=$row;
		}
		if (count($rows)>0) {
			$wrap=array('success'=>$rows[0]);
			print_r(json_encode($wrap));
		}
	}
			
} else if ($_GET['action']=="test")  {
?>
Sample save form
<form method="POST" action='?action=save'>
	<input type='hidden' name='id' value='1' >
	<textarea name='body' >this is it</textarea>
	<input type='submit' id="savebutton">
</form>	

<a href='?action=poll&id=1&dt_modified=11' >Poll</a>

<?php	
}


